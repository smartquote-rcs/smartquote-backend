import supabase from '../infra/supabase/connect';

interface SignUpInput {
  username: string;
  email: string;
  password: string;
}

interface SignInInput {
  email: string;
  password: string;
}

class AuthService {
  async signUp({ username, email, password }: SignUpInput) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: username },
      },
    });

    if (error) throw new Error(error.message);

    return {
      userId: data.user?.id,
    };
  }

  async signIn({ email, password }: SignInInput) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);

    return {
      token: data.session?.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    };
  }
}

export default new AuthService();
