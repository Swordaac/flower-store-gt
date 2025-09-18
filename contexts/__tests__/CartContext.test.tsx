import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartProvider, useCart } from '../CartContext';
import { UserProvider } from '../UserContext';

// Mock fetch
global.fetch = jest.fn();

// Mock data
const mockShopId = '68c34f45ee89e0fd81c8aa4d';
const mockProduct = {
  productId: '68c481477ce29a44c75aab63',
  name: 'Test Product (Deluxe)',
  price: 2000,
  image: 'test-image.jpg',
  selectedTier: 'deluxe',
};

const mockDeliveryInfo = {
  deliveryOption: 'delivery' as const,
  recipient: {
    name: 'John Doe',
    phone: '5146920307',
    email: 'john@example.com',
  },
  occasion: 'birthday',
  cardMessage: 'Happy Birthday!',
  contactPhone: '5146920307',
  contactEmail: 'contact@example.com',
  delivery: {
    address: {
      company: 'Test Company',
      street: '123 Test St',
      city: 'Montreal',
      province: 'QC',
      postalCode: 'H2X 2C9',
      country: 'Canada',
    },
    date: '2025-09-26',
    time: '10:00',
    instructions: 'Test instructions',
    buzzerCode: '123',
  },
};

// Mock user session
const mockUserSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
  },
  access_token: 'test-token',
};

// Test component that uses cart context
const TestComponent = () => {
  const { items, addToCart, removeFromCart, checkoutWithStripe } = useCart();
  
  return (
    <div>
      <div data-testid="cart-count">{items.length}</div>
      <button onClick={() => addToCart(mockProduct)}>Add to Cart</button>
      <button onClick={() => removeFromCart(mockProduct.productId)}>Remove from Cart</button>
      <button onClick={() => checkoutWithStripe(mockShopId, mockDeliveryInfo)}>
        Checkout
      </button>
    </div>
  );
};

describe('CartContext', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock localStorage
    Storage.prototype.getItem = jest.fn(() => null);
    Storage.prototype.setItem = jest.fn();
    
    // Mock successful fetch response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        sessionId: 'test-session-id',
        url: 'test-url',
        orderId: 'test-order-id',
      }),
    });
  });

  const renderTestComponent = () => {
    return render(
      <UserProvider initialSession={mockUserSession}>
        <CartProvider>
          <TestComponent />
        </CartProvider>
      </UserProvider>
    );
  };

  it('initializes with empty cart', () => {
    renderTestComponent();
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
  });

  it('loads cart from localStorage', () => {
    Storage.prototype.getItem = jest.fn(() => 
      JSON.stringify([{ ...mockProduct, quantity: 1 }])
    );
    
    renderTestComponent();
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1');
  });

  it('adds item to cart', async () => {
    const user = userEvent.setup();
    renderTestComponent();
    
    await user.click(screen.getByText(/Add to Cart/i));
    
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1');
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('removes item from cart', async () => {
    const user = userEvent.setup();
    Storage.prototype.getItem = jest.fn(() => 
      JSON.stringify([{ ...mockProduct, quantity: 1 }])
    );
    
    renderTestComponent();
    await user.click(screen.getByText(/Remove from Cart/i));
    
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'flower-store-cart',
      '[]'
    );
  });

  it('updates quantity when adding existing item', async () => {
    const user = userEvent.setup();
    Storage.prototype.getItem = jest.fn(() => 
      JSON.stringify([{ ...mockProduct, quantity: 1 }])
    );
    
    renderTestComponent();
    await user.click(screen.getByText(/Add to Cart/i));
    
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1');
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'flower-store-cart',
      JSON.stringify([{ ...mockProduct, quantity: 2 }])
    );
  });

  describe('checkoutWithStripe', () => {
    it('validates cart is not empty', async () => {
      const user = userEvent.setup();
      renderTestComponent();
      
      await user.click(screen.getByText(/Checkout/i));
      
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('validates authentication', async () => {
      const user = userEvent.setup();
      Storage.prototype.getItem = jest.fn(() => 
        JSON.stringify([{ ...mockProduct, quantity: 1 }])
      );
      
      render(
        <UserProvider initialSession={null}>
          <CartProvider>
            <TestComponent />
          </CartProvider>
        </UserProvider>
      );
      
      await user.click(screen.getByText(/Checkout/i));
      
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('sends correct payload to stripe checkout', async () => {
      const user = userEvent.setup();
      Storage.prototype.getItem = jest.fn(() => 
        JSON.stringify([{ ...mockProduct, quantity: 1 }])
      );
      
      renderTestComponent();
      await user.click(screen.getByText(/Checkout/i));
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:5001/api/stripe/create-checkout-session',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${mockUserSession.access_token}`,
            },
            body: expect.stringContaining(mockProduct.productId),
          })
        );
      });

      // Verify payload structure
      const payload = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(payload).toEqual({
        shopId: mockShopId,
        items: [{
          productId: mockProduct.productId,
          quantity: 1,
        }],
        delivery: {
          method: mockDeliveryInfo.deliveryOption,
          recipient: {
            name: mockDeliveryInfo.recipient.name,
            phone: mockDeliveryInfo.recipient.phone,
            email: mockDeliveryInfo.recipient.email,
          },
          occasion: mockDeliveryInfo.occasion,
          cardMessage: mockDeliveryInfo.cardMessage,
          contactPhone: mockDeliveryInfo.contactPhone,
          contactEmail: mockDeliveryInfo.contactEmail,
          specialInstructions: '',
          delivery: {
            address: {
              company: mockDeliveryInfo.delivery.address.company,
              street: mockDeliveryInfo.delivery.address.street,
              city: mockDeliveryInfo.delivery.address.city,
              province: mockDeliveryInfo.delivery.address.province,
              postalCode: mockDeliveryInfo.delivery.address.postalCode,
              country: 'Canada',
            },
            date: mockDeliveryInfo.delivery.date,
            time: mockDeliveryInfo.delivery.time,
            instructions: mockDeliveryInfo.delivery.instructions,
            buzzerCode: mockDeliveryInfo.delivery.buzzerCode,
          },
        },
        notes: 'Order from cart with 1 items',
      });
    });

    it('handles stripe checkout errors', async () => {
      const user = userEvent.setup();
      Storage.prototype.getItem = jest.fn(() => 
        JSON.stringify([{ ...mockProduct, quantity: 1 }])
      );
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: false,
          error: 'Test error',
        }),
      });
      
      renderTestComponent();
      await user.click(screen.getByText(/Checkout/i));
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });
});
