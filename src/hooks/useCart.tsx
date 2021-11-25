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
  //Função assincrona para verificar se tem estoque suficiente
  async function isStockSufficient(product: Product, amount?: number) {
    const productStock = (await api.get<Stock>(`stock/${product.id}`)).data;
    if (amount) {
      if (amount >= 0) {
        if (amount <= productStock.amount) {
          return true;
        } else {
          return false;
        }
      } else {
        if (product.amount > 0) {
          return true;
        } else {
          return false;
        }
      }
    } else {
      if (product.amount < productStock.amount) {
        return true;
      } else {
        return false;
      }
    }
  }

  const addProduct = async (productId: number) => {

    try {
      const product = (await api.get(`products/${productId}`)).data
      const isProductExist = cart.find(product => product.id === productId)
      if (isProductExist) {
        if (await isStockSufficient(isProductExist)) {
          cart[cart.indexOf(isProductExist)].amount += 1;
          setCart([...cart]);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
          return;
        } else {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
      } else {
        setCart([...cart, { ...product, amount: 1 }]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(
          [...cart, { ...product, amount: 1 }]));
      }

    } catch {
      toast.error('Erro na adição do produto');
      return;
    }

  };

  const removeProduct = (productId: number) => {
    try {
      const isProductExist = cart.find(product => product.id === productId);
      if (isProductExist) {
        cart.splice(cart.indexOf(isProductExist), 1);
        setCart([...cart]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));

      } else {
        toast.error('Erro na remoção do produto');
        return;
      }
    } catch {
      toast.error("Não foi possível remover o item!");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const isProductExist = cart.find(product => product.id === productId);
      if (isProductExist) {
        if (await isStockSufficient(isProductExist, amount)) {
          cart[cart.indexOf(isProductExist)].amount = amount;
          setCart([...cart]);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
      } else {
        toast.error('Erro na alteração de quantidade do produto');
        return;
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
      return;
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
