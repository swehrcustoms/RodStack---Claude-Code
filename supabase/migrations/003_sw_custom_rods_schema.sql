-- ============================================================
-- SW Custom Rods — Full Schema Extension
-- Migration 003: Run after 001 and 002
-- Adds: customers, invoices, time_entries, blanks
-- Extends rod_builds: status, priority, due_date, sale_price,
--                     blank_manufacturer, blank_model, customer_id
-- ============================================================

-- ---- Extend rod_builds ----
ALTER TABLE public.rod_builds
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'intake'
    CHECK (status IN ('intake', 'blank_prep', 'wrapping', 'finishing', 'done')),
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'standard'
    CHECK (priority IN ('standard', 'rush', 'vip')),
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS sale_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS blank_manufacturer TEXT,
  ADD COLUMN IF NOT EXISTS blank_model TEXT;

-- ---- CUSTOMERS ----
CREATE TABLE IF NOT EXISTS public.customers (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  address     TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS customers_user_id_idx
  ON public.customers (user_id, name);

CREATE TRIGGER customers_set_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own customers"
  ON public.customers FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add customer_id FK to rod_builds (after customers table exists)
ALTER TABLE public.rod_builds
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

-- ---- INVOICES ----
CREATE TABLE IF NOT EXISTS public.invoices (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  customer_id     UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  build_id        UUID REFERENCES public.rod_builds(id) ON DELETE SET NULL,
  invoice_number  TEXT NOT NULL,
  amount          NUMERIC(10,2) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date        DATE,
  paid_at         TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS invoices_user_id_idx
  ON public.invoices (user_id, status);

CREATE TRIGGER invoices_set_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own invoices"
  ON public.invoices FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---- TIME ENTRIES ----
CREATE TABLE IF NOT EXISTS public.time_entries (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  build_id    UUID REFERENCES public.rod_builds(id) ON DELETE CASCADE NOT NULL,
  hours       NUMERIC(5,2) NOT NULL,
  activity    TEXT NOT NULL,
  entry_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS time_entries_user_id_idx
  ON public.time_entries (user_id, build_id);

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own time entries"
  ON public.time_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---- BLANKS LIBRARY ----
CREATE TABLE IF NOT EXISTS public.blanks (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  manufacturer    TEXT NOT NULL,
  model           TEXT NOT NULL,
  length_ft       NUMERIC(4,1),
  power           TEXT,
  action          TEXT,
  material        TEXT,
  line_rating     TEXT,
  lure_rating     TEXT,
  cost            NUMERIC(10,2),
  supplier        TEXT,
  notes           TEXT,
  in_stock        BOOLEAN DEFAULT TRUE NOT NULL,
  quantity        INTEGER DEFAULT 0 NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS blanks_user_id_idx
  ON public.blanks (user_id, manufacturer, model);

CREATE TRIGGER blanks_set_updated_at
  BEFORE UPDATE ON public.blanks
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.blanks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own blanks"
  ON public.blanks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---- Auto-increment invoice numbers per user ----
CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1000;

CREATE OR REPLACE FUNCTION public.next_invoice_number(p_user_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count FROM public.invoices WHERE user_id = p_user_id;
  RETURN 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(v_count::TEXT, 3, '0');
END;
$$;
