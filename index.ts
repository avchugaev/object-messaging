// Import stylesheets
import './style.css';

interface Type<T> {
  new (...args: unknown[]): T;
}

interface Message<P = unknown> {
  readonly type: string;
  readonly payload: P;
}

interface MessageCreator<P = unknown> {
  readonly type: string;
  (payload: P): Message<P>;
}

function Message<P>(type: string): MessageCreator<P> {
  const creator: any = (payload: P): Message<P> => {
    return { type, payload };
  };

  creator.type = type;

  return creator;
}

type Publish = (message: Message) => void;
type Listener = (message: Message) => void;
type Unsubscribe = () => void;
type Subscribe = (listener: Listener) => Unsubscribe;
type Module = (pub: Publish, sub: Subscribe) => void;

function on<P>(creator: MessageCreator<P>, callback: (payload: P) => void) {
  return (message: Message) => {
    if (message.type === creator.type) {
      callback(message.payload as P);
    }
  };
}

function bootstrap(modules: readonly Module[]) {
  const listeners = new Set<Listener>();

  for (const module of modules) {
    const pub: Publish = (message) => {
      for (const listener of listeners) {
        listener(message);
      }
    };

    const sub: Subscribe = (callback) => {
      listeners.add(callback);

      return () => listeners.delete(callback);
    };

    module(pub, sub);
  }
}

// Auth module

interface Credentials {
  readonly username: string;
  readonly password: string;
}

const IsLoggedIn = Message<(isLoggedIn: boolean) => void>('is_logged_in');
const Login = Message<Credentials>('login');
const Logout = Message('logout');

const Auth: Module = (pub, sub) => {
  let isLoggedIn = false;

  sub(on(IsLoggedIn, (callback) => callback(isLoggedIn)));

  sub(on(Login, login));
  sub(on(Logout, logout));

  async function login({ username, password }: Credentials) {
    console.log('Login', username, password);
    isLoggedIn = true;
  }

  async function logout() {
    console.log('Logout');
    isLoggedIn = false;
  }
};

// Catalog module

interface Product {
  readonly name: string;
  readonly price: number;
}

const AddProduct = Message<Product>('add_product');

const Catalog: Module = (pub, sub) => {
  let isLoggedIn = false;

  pub(IsLoggedIn(setIsLoggedIn));

  function addProduct(product: Product) {}

  function setIsLoggedIn(value: boolean) {
    isLoggedIn = value;
  }
};

bootstrap([Auth, Catalog]);
