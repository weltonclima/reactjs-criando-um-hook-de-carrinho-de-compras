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
  addProduct: (productId: number) => void;
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
    try {
      const update = [...cart];
      const exists = update.find(p => p.id === productId);
      const { data: stock } = await api.get<Stock>(`stock/${productId}`);
      const currentAmount = exists ? exists.amount : 0;
      const amount = currentAmount + 1;

      if (amount > stock.amount) {
        return toast.error('Quantidade solicitada fora de estoque');
      }
      if (exists) {
        exists.amount = amount;
      } else {
        const { data: product } = await api.get<Product>(`products/${productId}`);
        const newProduct = {
          ...product,
          amount: 1
        }
        update.push(newProduct);
      }
      setCart(update);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(update))
    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const update = [...cart];
      const index = update.findIndex(p => p.id === productId);

      if (index >= 0) {
        update.splice(index, 1);
        setCart(update);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(update))
      } else {
        throw new Error();
      }
    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }

      const { data: stock } = await api.get<Stock>(`stock/${productId}`);
      if (amount > stock.amount) {
        return toast.error('Quantidade solicitada fora de estoque')
      }

      const update = [...cart];
      const exists = update.find(p => p.id === productId);

      if (exists) {
        exists.amount = amount;
        setCart(update);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(update))
      }else{
        throw new Error();
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addProduct,
        removeProduct,
        updateProductAmount
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
