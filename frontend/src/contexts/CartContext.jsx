import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';
import * as orderService from '../services/orderService';

// Create context
const CartContext = createContext();

// Custom hook to use the cart context
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartItemCount, setCartItemCount] = useState(0);

  // Fetch cart when user is authenticated
  useEffect(() => {
    const fetchCart = async () => {
      if (!isAuthenticated) {
        setCart(null);
        setCartTotal(0);
        setCartItemCount(0);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await orderService.getUserCart();
        if (response.success) {
          setCart(response.data);
          setCartTotal(response.total);
          setCartItemCount(response.data.items.length);
        }
      } catch (error) {
        console.error('Failed to fetch cart:', error);
        // If cart not found, it's not an error - user might not have a cart yet
        if (error.response && error.response.status === 404) {
          setCart(null);
          setCartTotal(0);
          setCartItemCount(0);
        } else {
          toast.error('Failed to load cart');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [isAuthenticated, user]);

  // Add item to cart
  const addToCart = async (item) => {
    if (!isAuthenticated) {
      toast.error('Please log in to add items to cart');
      return false;
    }

    try {
      setLoading(true);
      const response = await orderService.addToCart(item);
      
      if (response.success) {
        setCart(response.data);
        setCartTotal(response.total);
        setCartItemCount(response.data.items.length);
        toast.success('Item added to cart');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      toast.error(error.response?.data?.message || 'Failed to add item to cart');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update cart item
  const updateCartItem = async (itemId, quantity, notes) => {
    if (!isAuthenticated) {
      toast.error('Please log in to update your cart');
      return false;
    }

    try {
      setLoading(true);
      const response = await orderService.updateCartItem(itemId, { quantity, notes });
      
      if (response.success) {
        setCart(response.data);
        setCartTotal(response.total);
        setCartItemCount(response.data.items.length);
        toast.success('Cart updated');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update cart item:', error);
      toast.error(error.response?.data?.message || 'Failed to update cart');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId) => {
    if (!isAuthenticated) {
      toast.error('Please log in to update your cart');
      return false;
    }

    try {
      setLoading(true);
      const response = await orderService.removeFromCart(itemId);
      
      if (response.success) {
        setCart(response.data);
        setCartTotal(response.total);
        setCartItemCount(response.data.items.length);
        toast.success('Item removed from cart');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      toast.error(error.response?.data?.message || 'Failed to remove item');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to update your cart');
      return false;
    }

    try {
      setLoading(true);
      const response = await orderService.clearCart();
      
      if (response.success) {
        setCart(response.data);
        setCartTotal(0);
        setCartItemCount(0);
        toast.success('Cart cleared');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to clear cart:', error);
      toast.error(error.response?.data?.message || 'Failed to clear cart');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Create order from cart
  const createOrder = async (orderData) => {
    if (!isAuthenticated) {
      toast.error('Please log in to place an order');
      return false;
    }

    try {
      setLoading(true);
      const response = await orderService.createOrder(orderData);
      
      if (response.success) {
        // Clear cart state after successful order
        setCart(null);
        setCartTotal(0);
        setCartItemCount(0);
        toast.success('Order placed successfully!');
        return response.data;
      }
      return false;
    } catch (error) {
      console.error('Failed to create order:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    cart,
    loading,
    cartTotal,
    cartItemCount,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    createOrder
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}; 
 
 
 
 