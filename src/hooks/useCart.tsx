import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    const product = (await api.get(`products/${productId}`)).data
    const productStock = (await api.get<Stock>(`stock/${productId}`)).data;
    const isProductExist = cart.find(product => product.id === productId);
    console.log(isProductExist);
    if (isProductExist) {
      if (isProductExist.amount < productStock.amount) {
        cart[cart.indexOf(isProductExist)].amount += 1;
        setCart([...cart]);
      }
    } else {
      setCart([...cart, { ...product, amount: 1 }])
    }
    try {
      // setCart([...cart, ]);
      // localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
    } catch {
      // TODO
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const isProductExist = cart.find(product => product.id === productId);
      if (isProductExist) {
        cart[cart.indexOf(isProductExist)].amount = amount;
        setCart([...cart])
      }

    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
