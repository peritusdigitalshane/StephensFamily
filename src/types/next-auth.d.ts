import 'next-auth';

declare module 'next-auth' {
  interface User {
    role: string;
    color: string;
    avatar: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      color: string;
      avatar: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    color: string;
    avatar: string;
    userId: string;
  }
}
