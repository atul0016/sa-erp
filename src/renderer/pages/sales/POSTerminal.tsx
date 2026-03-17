/**
 * POS Terminal Page
 * 
 * Point of Sale interface with offline support per The ERP Architect's Handbook
 */

import { useState, useEffect, useRef } from 'react';
import {
  ShoppingCartIcon,
  MagnifyingGlassIcon,
  QrCodeIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
  CreditCardIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  UserIcon,
  PrinterIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface CartItem {
  id: string;
  sku: string;
  name: string;
  hsn_code: string;
  quantity: number;
  price: number;
  discount: number;
  gst_rate: number;
  gst_amount: number;
  total: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  gstin?: string;
  loyalty_points: number;
}

interface PaymentMethod {
  type: 'cash' | 'card' | 'upi' | 'wallet';
  amount: number;
  reference?: string;
}

export default function POSTerminal() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Products mock data
  const products = [
    { id: '1', sku: 'SKU001', name: 'Product A', barcode: '8901234567890', price: 499, gst_rate: 18, hsn_code: '8471' },
    { id: '2', sku: 'SKU002', name: 'Product B', barcode: '8901234567891', price: 299, gst_rate: 12, hsn_code: '8472' },
    { id: '3', sku: 'SKU003', name: 'Product C', barcode: '8901234567892', price: 799, gst_rate: 18, hsn_code: '8473' },
    { id: '4', sku: 'SKU004', name: 'Product D', barcode: '8901234567893', price: 149, gst_rate: 5, hsn_code: '8474' },
    { id: '5', sku: 'SKU005', name: 'Product E', barcode: '8901234567894', price: 1299, gst_rate: 18, hsn_code: '8475' },
    { id: '6', sku: 'SKU006', name: 'Product F', barcode: '8901234567895', price: 599, gst_rate: 12, hsn_code: '8476' },
  ];

  // Focus search on mount and keyboard shortcut
  useEffect(() => {
    searchInputRef.current?.focus();
    
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'F5') {
        e.preventDefault();
        if (cart.length > 0) setShowPaymentModal(true);
      }
      if (e.key === 'F8') {
        e.preventDefault();
        setShowCustomerModal(true);
      }
      if (e.key === 'Escape') {
        setShowPaymentModal(false);
        setShowCustomerModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [cart.length]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Check if it's a barcode (numeric and specific length)
    const product = products.find(p => p.barcode === query || p.sku.toLowerCase() === query.toLowerCase());
    if (product) {
      addToCart(product);
      setSearchQuery('');
    }
  };

  const addToCart = (product: typeof products[0]) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      updateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const gstAmount = (product.price * product.gst_rate) / (100 + product.gst_rate);
      const newItem: CartItem = {
        id: product.id,
        sku: product.sku,
        name: product.name,
        hsn_code: product.hsn_code,
        quantity: 1,
        price: product.price,
        discount: 0,
        gst_rate: product.gst_rate,
        gst_amount: gstAmount,
        total: product.price,
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.id !== id));
    } else {
      setCart(cart.map(item => {
        if (item.id === id) {
          const total = item.price * quantity - item.discount;
          const gstAmount = (total * item.gst_rate) / (100 + item.gst_rate);
          return { ...item, quantity, total, gst_amount: gstAmount * quantity };
        }
        return item;
      }));
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const getCartTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = cart.reduce((sum, item) => sum + item.discount, 0);
    const gstTotal = cart.reduce((sum, item) => sum + item.gst_amount, 0);
    const pointsValue = redeemPoints * 0.5; // 1 point = ₹0.50
    const grandTotal = subtotal - discount - pointsValue;
    
    return { subtotal, discount, gstTotal, pointsValue, grandTotal };
  };

  const handlePayment = (type: 'cash' | 'card' | 'upi' | 'wallet') => {
    const { grandTotal } = getCartTotals();
    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = grandTotal - paidAmount;
    
    if (remaining > 0) {
      setPayments([...payments, { type, amount: remaining }]);
    }
  };

  const completeTransaction = () => {
    // Complete the sale
    console.log('Transaction completed', { cart, customer: selectedCustomer, payments });
    
    // Clear cart
    setCart([]);
    setPayments([]);
    setSelectedCustomer(null);
    setRedeemPoints(0);
    setShowPaymentModal(false);
  };

  const totals = getCartTotals();
  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = totals.grandTotal - paidAmount;

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Left Panel - Products */}
      <div className="w-2/3 flex flex-col">
        {/* Search Bar */}
        <div className="p-4 bg-white border-b">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Scan barcode or search product (F2)"
                className="w-full pl-10 pr-4 py-3 border rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <button className="px-4 py-2 bg-gray-100 border rounded-lg hover:bg-gray-200 flex items-center gap-2">
              <QrCodeIcon className="h-5 w-5" />
              Scan
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-4 gap-4">
            {products
              .filter(p => 
                searchQuery === '' || 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.sku.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white rounded-xl p-4 border hover:border-blue-500 hover:shadow-md transition-all text-left"
                >
                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                    <ShoppingCartIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  <div className="text-xs text-gray-500">{product.sku}</div>
                  <div className="font-medium text-gray-800 truncate">{product.name}</div>
                  <div className="text-lg font-bold text-blue-600 mt-1">
                    {formatCurrency(product.price)}
                  </div>
                  <div className="text-xs text-gray-500">GST: {product.gst_rate}%</div>
                </button>
              ))}
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="p-2 bg-gray-200 text-xs text-gray-600 flex gap-4 justify-center">
          <span>F2: Search</span>
          <span>F5: Payment</span>
          <span>F8: Customer</span>
          <span>ESC: Cancel</span>
        </div>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-1/3 bg-white flex flex-col border-l">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShoppingCartIcon className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-lg">Current Sale</span>
          </div>
          {isOffline && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs flex items-center gap-1">
              <ArrowPathIcon className="h-4 w-4" />
              Offline Mode
            </span>
          )}
        </div>

        {/* Customer */}
        <div className="p-3 border-b">
          <button
            onClick={() => setShowCustomerModal(true)}
            className="w-full p-3 border-2 border-dashed rounded-lg flex items-center gap-3 hover:bg-gray-50"
          >
            <UserIcon className="h-6 w-6 text-gray-400" />
            {selectedCustomer ? (
              <div className="text-left">
                <div className="font-medium text-gray-800">{selectedCustomer.name}</div>
                <div className="text-sm text-gray-500">
                  {selectedCustomer.phone} • {selectedCustomer.loyalty_points} points
                </div>
              </div>
            ) : (
              <span className="text-gray-500">Add Customer (F8)</span>
            )}
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingCartIcon className="h-16 w-16 mb-4" />
              <p>Cart is empty</p>
              <p className="text-sm">Scan or search to add items</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-gray-800">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.sku} • HSN: {item.hsn_code}</div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 hover:bg-red-100 rounded text-red-500"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 bg-white border rounded hover:bg-gray-100"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 bg-white border rounded hover:bg-gray-100"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-800">{formatCurrency(item.total)}</div>
                      <div className="text-xs text-gray-500">{formatCurrency(item.price)} × {item.quantity}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="p-4 border-t bg-gray-50">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(totals.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>GST (Incl.)</span>
              <span>{formatCurrency(totals.gstTotal)}</span>
            </div>
            {totals.pointsValue > 0 && (
              <div className="flex justify-between text-blue-600">
                <span>Points Redeemed</span>
                <span>-{formatCurrency(totals.pointsValue)}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-2xl font-bold text-blue-600">{formatCurrency(totals.grandTotal)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t">
          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={cart.length === 0}
            className="w-full py-4 bg-blue-600 text-white rounded-xl text-lg font-semibold
                       hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            <BanknotesIcon className="h-6 w-6" />
            Pay {formatCurrency(totals.grandTotal)} (F5)
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Payment</h2>

            {/* Amount Display */}
            <div className="bg-gray-100 rounded-xl p-6 text-center mb-6">
              <div className="text-gray-500 mb-1">Amount Due</div>
              <div className={`text-4xl font-bold ${remainingAmount <= 0 ? 'text-green-600' : 'text-gray-800'}`}>
                {formatCurrency(Math.max(0, remainingAmount))}
              </div>
              {payments.length > 0 && (
                <div className="text-sm text-gray-500 mt-2">
                  Paid: {formatCurrency(paidAmount)} of {formatCurrency(totals.grandTotal)}
                </div>
              )}
            </div>

            {/* Payment Methods */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => handlePayment('cash')}
                className="p-4 border-2 rounded-xl hover:border-blue-500 flex flex-col items-center"
              >
                <BanknotesIcon className="h-8 w-8 text-green-600 mb-2" />
                <span className="font-medium">Cash</span>
              </button>
              <button
                onClick={() => handlePayment('card')}
                className="p-4 border-2 rounded-xl hover:border-blue-500 flex flex-col items-center"
              >
                <CreditCardIcon className="h-8 w-8 text-blue-600 mb-2" />
                <span className="font-medium">Card</span>
              </button>
              <button
                onClick={() => handlePayment('upi')}
                className="p-4 border-2 rounded-xl hover:border-blue-500 flex flex-col items-center"
              >
                <QrCodeIcon className="h-8 w-8 text-purple-600 mb-2" />
                <span className="font-medium">UPI</span>
              </button>
              <button
                onClick={() => handlePayment('wallet')}
                className="p-4 border-2 rounded-xl hover:border-blue-500 flex flex-col items-center"
              >
                <ReceiptPercentIcon className="h-8 w-8 text-orange-600 mb-2" />
                <span className="font-medium">Wallet</span>
              </button>
            </div>

            {/* Payments Made */}
            {payments.length > 0 && (
              <div className="mb-6">
                <div className="text-sm font-medium text-gray-600 mb-2">Payments</div>
                <div className="space-y-2">
                  {payments.map((p, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                      <span className="capitalize">{p.type}</span>
                      <span className="font-medium">{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowPaymentModal(false); setPayments([]); }}
                className="flex-1 py-3 border rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={completeTransaction}
                disabled={remainingAmount > 0}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700
                           disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <PrinterIcon className="h-5 w-5" />
                Complete & Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Select Customer</h2>

            <div className="relative mb-4">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or phone..."
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {[
                { id: '1', name: 'Rahul Sharma', phone: '9876543210', loyalty_points: 450 },
                { id: '2', name: 'Priya Singh', phone: '9876543211', gstin: '27AABCU9603R1ZM', loyalty_points: 1250 },
                { id: '3', name: 'Amit Patel', phone: '9876543212', loyalty_points: 85 },
              ].map(customer => (
                <button
                  key={customer.id}
                  onClick={() => { setSelectedCustomer(customer); setShowCustomerModal(false); }}
                  className="w-full p-3 border rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-800">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-blue-600">{customer.loyalty_points} pts</div>
                      {customer.gstin && <div className="text-xs text-gray-500">GST Registered</div>}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCustomerModal(false)}
                className="flex-1 py-3 border rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2">
                <PlusIcon className="h-5 w-5" />
                New Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
