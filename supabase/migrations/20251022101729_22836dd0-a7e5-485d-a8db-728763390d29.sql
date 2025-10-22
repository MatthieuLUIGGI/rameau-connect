-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('user', 'ag');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create artisans table
CREATE TABLE public.artisans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.artisans ENABLE ROW LEVEL SECURITY;

-- Create membres_assemblee table
CREATE TABLE public.membres_assemblee (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.membres_assemblee ENABLE ROW LEVEL SECURITY;

-- Create actualites table
CREATE TABLE public.actualites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.actualites ENABLE ROW LEVEL SECURITY;

-- Create sondages table
CREATE TABLE public.sondages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.sondages ENABLE ROW LEVEL SECURITY;

-- Create votes table for sondages
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sondage_id UUID REFERENCES public.sondages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sondage_id, user_id)
);

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Only AG members can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'ag'));

-- RLS Policies for artisans
CREATE POLICY "Anyone authenticated can view artisans"
  ON public.artisans FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Only AG members can manage artisans"
  ON public.artisans FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'ag'));

-- RLS Policies for membres_assemblee
CREATE POLICY "Anyone authenticated can view membres"
  ON public.membres_assemblee FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Only AG members can manage membres"
  ON public.membres_assemblee FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'ag'));

-- RLS Policies for actualites
CREATE POLICY "Anyone authenticated can view actualites"
  ON public.actualites FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Only AG members can manage actualites"
  ON public.actualites FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'ag'));

-- RLS Policies for sondages
CREATE POLICY "Anyone authenticated can view sondages"
  ON public.sondages FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Only AG members can manage sondages"
  ON public.sondages FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'ag'));

-- RLS Policies for votes
CREATE POLICY "Users can view their own votes"
  ON public.votes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own votes"
  ON public.votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "AG members can view all votes"
  ON public.votes FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'ag'));

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.email
  );
  
  -- Give default 'user' role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_artisans_updated_at
  BEFORE UPDATE ON public.artisans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_membres_assemblee_updated_at
  BEFORE UPDATE ON public.membres_assemblee
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_actualites_updated_at
  BEFORE UPDATE ON public.actualites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sondages_updated_at
  BEFORE UPDATE ON public.sondages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();