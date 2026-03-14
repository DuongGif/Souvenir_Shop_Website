import React, { createContext, useMemo, useState } from "react";
import { cartService } from "../services/cartService";

export const CartContext = createContext(null);

export default function CartProvider({ children }) {
  const [cart, setCart] = useState({ cartId: 0, items: [], subtotal: 0 });

  const refresh = async () => {
    const res = await cartService.get();
    setCart(res.data);
  };

  const value = useMemo(() => ({ cart, setCart, refresh }), [cart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}