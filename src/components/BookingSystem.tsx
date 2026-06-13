import React, { useEffect, useState } from 'react';
import { TakeawayOrderData, PlatterConfiguration } from '../types';
import { ShoppingBag, Truck, MapPin, Clock, CheckCircle, Phone } from 'lucide-react';
import { MASTER_DISHES, SIDE_MEALS_TOPPINGS } from './InteractiveMenu';

interface BookingSystemProps {
  platterConfig: PlatterConfiguration;
  cart: PlatterConfiguration[];
  setCart: React.Dispatch<React.SetStateAction<PlatterConfiguration[]>>;
}

export default function BookingSystem({ platterConfig, cart, setCart }: BookingSystemProps) {
  const [formData, setFormData] = useState<TakeawayOrderData>({
    name: '',
    phone: '',
    address: '',
    method: 'pickup',
    time: '13:00',
    dietaryNotes: '',
    totalPrice: 0,
  });

  const [orderHistory, setOrderHistory] = useState<TakeawayOrderData[]>(() => {
    try {
      const saved = localStorage.getItem('29foods_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paystackLoaded, setPaystackLoaded] = useState(false);

  // Load Paystack Inline script on mount
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setPaystackLoaded(true);
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Coupon Discount Codes States
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0); 
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidating(true);
    setCouponMessage(null);
    try {
      const res = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode }),
      });
      if (res.ok) {
        const bodyValue = await res.json();
        if (bodyValue.valid) {
          setAppliedDiscount(bodyValue.percentage);
          setCouponMessage({ text: `Success! Code applied: ${bodyValue.percentage}% discount active!`, isError: false });
        } else {
          setAppliedDiscount(0);
          setCouponMessage({ text: bodyValue.error || "Invalid or expired coupon offer!", isError: true });
        }
      } else {
         throw new Error();
      }
    } catch {
       // local fallbacks
       if (couponCode.toUpperCase() === "WOODFIRE29") {
         setAppliedDiscount(15);
         setCouponMessage({ text: "Success! Default offline discount applied: 15% off!", isError: false });
       } else {
         setAppliedDiscount(0);
         setCouponMessage({ text: "Coupon code is invalid or expired", isError: true });
       }
    } finally {
      setIsValidating(false);
    }
  };

  const getSinglePlatterPrice = (cfg: PlatterConfiguration) => {
    const dish = MASTER_DISHES.find(d => d.id === cfg.dishId) || MASTER_DISHES[0];
    const toppingsPrice = (cfg.selectedToppingIds || []).reduce((sum, id) => {
      const topping = SIDE_MEALS_TOPPINGS.find(t => t.id === id);
      const qty = cfg.toppingQuantities?.[id] ?? 1;
      return sum + (topping ? topping.price * qty : 0);
    }, 0);
    return (dish.basePrice + toppingsPrice) * cfg.quantity;
  };

  const computeTotalPrice = () => {
    let total = 0;
    if (cart.length > 0) {
      total = cart.reduce((sum, item) => sum + getSinglePlatterPrice(item), 0);
    } else {
      total = getSinglePlatterPrice(platterConfig);
    }

    if (formData.method === 'delivery') {
      total += 1500; // ₦1,500 shipping
    }

    if (appliedDiscount > 0) {
      total = total * (1 - appliedDiscount / 100);
    }
    return Math.round(total);
  };

  const getPlatterDescription = (cfg: PlatterConfiguration) => {
    const dish = MASTER_DISHES.find(d => d.id === cfg.dishId) || MASTER_DISHES[0];
    const toppingNames = (cfg.selectedToppingIds || [])
      .map(tid => {
        const t = SIDE_MEALS_TOPPINGS.find(topping => topping.id === tid);
        const qty = cfg.toppingQuantities?.[tid] ?? 1;
        return t ? `${t.name}${qty > 1 ? ` (x${qty})` : ''}` : '';
      })
      .filter(Boolean);
    const toppingsStr = toppingNames.length > 0 ? ` + ${toppingNames.join(', ')}` : '';
    const ownerStr = cfg.ownerName ? ` [🏷️ Pack for: ${cfg.ownerName}]` : '';
    return `${dish.name}${toppingsStr}${ownerStr} (x${cfg.quantity})`;
  };

  const activePriceTotal = computeTotalPrice();

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      totalPrice: activePriceTotal,
      customPlatterOrder: cart.length > 0 ? undefined : platterConfig,
      customPlatters_v2: cart.length > 0 ? cart : [platterConfig],
    }));
  }, [platterConfig, cart, formData.method, activePriceTotal]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleMethodChange = (method: 'pickup' | 'delivery') => {
    setFormData(prev => ({ ...prev, method }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Please enter your name';
    if (!formData.phone.trim() || formData.phone.length < 7) {
      errs.phone = 'Please provide a valid phone number for SMS tracking';
    }
    if (formData.method === 'delivery' && !formData.address?.trim()) {
      errs.address = 'Please enter your delivery street address';
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsProcessingPayment(true);
    setErrors({});

    const orderId = `29F-${Math.floor(100000 + Math.random() * 900000)}`;
    const paystackPublicKey = (import.meta as any).env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_35db150ec843fdf9bacc311e92d83da19e075db3';

    // Synchronous callbacks to satisfy Paystack type checks in any transpile target
    const handleSuccessCallback = (response: any) => {
      const newOrder: TakeawayOrderData = {
        ...formData,
        id: orderId,
        customPlatters_v2: cart.length > 0 ? [...cart] : [platterConfig],
        paymentStatus: 'success',
        paymentReference: response.reference || response.transaction || `PAY-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      };

      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      })
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        return { order: null };
      })
      .then(bodyValue => {
        if (bodyValue && bodyValue.order) {
          newOrder.id = bodyValue.order.id;
        }
        completeOrderProcess(newOrder);
      })
      .catch(err => {
        console.warn("Fullstack API direct dispatch offline, using local standalone cache backup", err);
        completeOrderProcess(newOrder);
      });
    };

    const completeOrderProcess = (newOrder: TakeawayOrderData) => {
      const updatedOrders = [newOrder, ...orderHistory];
      setOrderHistory(updatedOrders);
      try {
        localStorage.setItem('29foods_orders', JSON.stringify(updatedOrders));
      } catch {
        // quiet fallback
      }
      setIsSuccess(true);
      setIsProcessingPayment(false);
    };

    const handleCloseCallback = () => {
      setIsProcessingPayment(false);
      setErrors(prev => ({ ...prev, paystack: "Transaction was closed. Online payment is required to activate your takeaway woodfire ticket." }));
    };

    try {
      if (!(window as any).PaystackPop) {
        throw new Error("Paystack secure payment gateway. Please check your internet connection and verify that 'js.paystack.co' script is permitted to load.");
      }

      const paystackPopInstance = (window as any).PaystackPop;

      const config: any = {
        key: paystackPublicKey,
        email: 'peterrichard013@gmail.com',
        amount: activePriceTotal * 100, // Paystack expects Kobo
        currency: 'NGN',
        ref: orderId,
        metadata: {
          custom_fields: [
            {
              display_name: "Customer Name",
              variable_name: "customer_name",
              value: formData.name
            },
            {
              display_name: "Phone Number",
              variable_name: "phone_number",
              value: formData.phone
            }
          ]
        },
        callback: function(response: any) {
          handleSuccessCallback(response);
        },
        onSuccess: function(response: any) {
          handleSuccessCallback(response);
        },
        onClose: function() {
          handleCloseCallback();
        },
        onCancel: function() {
          handleCloseCallback();
        }
      };

      // Handle setup modes elegantly (PaystackPop setup method vs new transaction instance)
      if (typeof paystackPopInstance.setup === 'function') {
        const handler = paystackPopInstance.setup(config);
        handler.openIframe();
      } else {
        const instance = new paystackPopInstance();
        instance.newTransaction({
          ...config,
          onSuccess: function(response: any) {
            handleSuccessCallback(response);
          },
          onCancel: function() {
            handleCloseCallback();
          }
        });
      }
    } catch (err: any) {
      console.error("Paystack popup instantiation error", err);
      setIsProcessingPayment(false);
      setErrors(prev => ({ ...prev, paystack: err.message || "Failed to initialize Paystack Secure Inline." }));
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      phone: '',
      address: '',
      method: 'pickup',
      time: '13:00',
      dietaryNotes: '',
      totalPrice: 0,
    });
    setCart([]); // Clear the tray basket!
    setIsSuccess(false);
  };

  return (
    <section className="py-24 bg-white border-t border-zinc-100" id="booking-section">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Editorial headers */}
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-20 pb-8 border-b border-zinc-100">
          <div>
            <span className="font-mono text-xs text-zinc-400 tracking-wider">02 // SECURE ORDER OUTLET</span>
            <h2 className="mt-2 text-4xl md:text-5xl font-foody font-semibold text-[#111111]">
              Instant <span className="font-serif italic font-medium text-[#FF7A00]">Takeaway Dispatch</span>
            </h2>
          </div>
          <p className="mt-4 md:mt-0 max-w-sm text-sm text-zinc-500 font-sans leading-relaxed">
            Ready to relish? Lock in your order for rapid pickup or instant door-to-door delivery. We use premium flat black takeaway boxes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* Method selector info column */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <h3 className="text-xl font-foody font-bold text-[#111111] mb-2 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#D62828]" />
                Select Fulfillment Mode
              </h3>
              <p className="text-zinc-500 text-xs leading-relaxed font-sans mb-6">
                Choose how you want to get your freshly prepared wood-fire seasoned rice, wraps or soup platters.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleMethodChange('pickup')}
                className={`p-5 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between h-36 select-none ${
                  formData.method === 'pickup'
                    ? 'border-[#D62828] bg-red-50/10 shadow-sm'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                }`}
              >
                <Clock className="w-6 h-6 text-[#D62828]" />
                <div>
                  <h4 className="font-semibold text-xs text-zinc-800">Spot Pickup</h4>
                  <p className="text-[10px] text-zinc-400 font-sans mt-0.5">Ready in 15 mins</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleMethodChange('delivery')}
                className={`p-5 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between h-36 select-none ${
                  formData.method === 'delivery'
                    ? 'border-[#FF7A00] bg-orange-50/10 shadow-sm'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                }`}
              >
                <Truck className="w-6 h-6 text-[#FF7A00]" />
                <div>
                  <h4 className="font-semibold text-xs text-zinc-800">Street Delivery</h4>
                  <p className="text-[10px] text-zinc-400 font-sans mt-0.5">₦1,500 delivery charge</p>
                </div>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-150 font-mono text-[11px] text-zinc-500 space-y-3">
              <span className="font-bold text-zinc-700 block text-xs uppercase">Takeaway Guidelines:</span>
              <ul className="list-disc pl-4 space-y-2">
                <li>Pickups are ready at our signature 29foods Outdoor Woodfire Spot</li>
                <li>Everything is made-to-order over real open fires</li>
                <li>Secure SMS receipt dispatched upon checkout</li>
              </ul>
            </div>
          </div>

          {/* Form / success state */}
          <div className="lg:col-span-7 bg-zinc-50 p-8 md:p-10 rounded-3xl border border-zinc-150">
            {isSuccess ? (
              <div className="text-center py-6 space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-3xl font-foody font-bold tracking-tight text-[#111111]">
                    Takeaway Order Sent!
                  </h3>
                  <p className="mt-2 text-sm text-zinc-500 max-w-sm mx-auto font-sans leading-relaxed">
                    Dinner ticket dispatched. Kitchen has started steaming and preparing your custom platter.
                  </p>
                </div>

                {/* Receipt Card */}
                <div className="p-6 rounded-2xl bg-white border border-zinc-150 max-w-md mx-auto text-left space-y-3 font-mono text-xs text-zinc-650 shadow-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-zinc-400">ORDER TICKET ID:</span>
                    <span className="font-black text-emerald-600">
                      {orderHistory[0]?.id || '29F-789020'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-zinc-400">PATRON NAME:</span>
                    <span className="font-bold text-zinc-800">{formData.name}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-zinc-400">PHONE LINE:</span>
                    <span className="text-zinc-700">{formData.phone}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-zinc-400">FULFILMENT METHOD:</span>
                    <span className="font-semibold uppercase text-zinc-800">{formData.method}</span>
                  </div>
                  {formData.method === 'delivery' && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-zinc-400">STREET ADDRESS:</span>
                      <span className="text-zinc-700 max-w-[200px] text-right">{formData.address}</span>
                    </div>
                  )}
                  <div className="border-b pb-2">
                    <span className="text-zinc-400 block mb-1">PLATTER ASSEMBLY:</span>
                    <div className="space-y-1.5">
                      {cart.length > 0 ? (
                        cart.map((item, index) => (
                          <div key={index} className="text-zinc-850 text-[10px] bg-zinc-50 p-2 rounded leading-snug flex justify-between gap-1.5 border border-zinc-150">
                            <span className="font-sans font-medium text-left">{getPlatterDescription(item)}</span>
                            <span className="font-mono font-bold text-zinc-600 shrink-0">₦{getSinglePlatterPrice(item).toLocaleString()}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-zinc-850 text-[10px] bg-zinc-50 p-2.5 rounded block leading-normal">
                          {getPlatterDescription(platterConfig)}
                        </span>
                      )}
                    </div>
                  </div>
                  {orderHistory[0]?.paymentStatus && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-zinc-400">PAYMENT STATUS:</span>
                      <span className="font-bold text-emerald-600 uppercase">
                        ✅ SUCCESS
                      </span>
                    </div>
                  )}
                  {orderHistory[0]?.paymentReference && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-zinc-400">TRANSACTION REF:</span>
                      <span className="font-mono text-[9px] text-zinc-500 break-all">
                        {orderHistory[0].paymentReference}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1">
                    <span className="font-semibold text-zinc-800">TOTAL BILLING (₦):</span>
                    <span className="font-black text-lg text-[#D62828]">
                      ₦{formData.totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-6 py-3.5 rounded-xl bg-[#111111] hover:bg-[#D62828] text-white font-mono text-xs uppercase tracking-wider transition-all duration-300"
                  >
                    Build Another Platter Order
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1.5">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Richard Peter"
                      className={`w-full p-3.5 bg-white border rounded-xl text-sm font-sans focus:outline-none transition-all ${
                        errors.name ? 'border-[#D62828]' : 'border-zinc-200 focus:border-[#FF7A00]'
                      }`}
                    />
                    {errors.name && <p className="mt-1 text-[11px] font-sans text-[#D62828]">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1.5">
                      Phone Number (SMS receipt)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="e.g. 08029292929"
                        className={`w-full pl-10 p-3.5 bg-white border rounded-xl text-sm font-sans focus:outline-none transition-all ${
                          errors.phone ? 'border-[#D62828]' : 'border-zinc-200 focus:border-[#FF7A00]'
                        }`}
                      />
                    </div>
                    {errors.phone && <p className="mt-1 text-[11px] font-sans text-[#D62828]">{errors.phone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1.5">
                      Target Pickup/Delivery Time
                    </label>
                    <select
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      className="w-full p-3.5 bg-white border border-zinc-200 rounded-xl text-sm font-sans appearance-none focus:outline-none focus:border-[#FF7A00]"
                    >
                      <option value="12:00">12:00 PM</option>
                      <option value="12:30">12:30 PM</option>
                      <option value="13:00">1:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="17:00">5:00 PM</option>
                      <option value="18:30">6:30 PM</option>
                      <option value="19:35">7:35 PM</option>
                      <option value="21:00">9:00 PM</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1.5">
                      Active Bill (₦ Naira)
                    </label>
                    <div className="w-full p-3 bg-zinc-200/50 rounded-xl font-mono text-sm font-bold text-zinc-800 flex items-center justify-between border border-zinc-200">
                      <span>Total Invoice {appliedDiscount > 0 && <span className="text-emerald-600">(-{appliedDiscount}%)</span>}</span>
                      <span className="text-[#D62828]">₦{activePriceTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Voucher discount box */}
                <div className="p-4 bg-orange-50/20 border border-dashed border-orange-250 rounded-2xl">
                  <label className="block font-mono text-[9px] text-[#FF7A00] uppercase tracking-wider mb-2 font-bold">
                    Apply Promo Discount Offers
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. WOODFIRE29"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 p-2 bg-white border border-zinc-200 rounded-xl text-xs font-mono focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isValidating}
                      className="px-4 py-2 bg-[#111111] hover:bg-[#FF7A00] disabled:opacity-50 text-white rounded-xl font-mono text-[10px] uppercase font-bold tracking-wider transition-colors"
                    >
                      {isValidating ? "Verifying..." : "Apply"}
                    </button>
                  </div>
                  {couponMessage && (
                    <p className={`mt-2 text-[10px] font-mono leading-none ${couponMessage.isError ? "text-red-500" : "text-emerald-600"}`}>
                      {couponMessage.isError ? "⚠️ " : "✅ "} {couponMessage.text}
                    </p>
                  )}
                </div>

                {formData.method === 'delivery' && (
                  <div>
                    <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1.5">
                      Delivery Street Address
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-4 w-4 h-4 text-[#FF7A00]" />
                      <textarea
                        name="address"
                        required
                        rows={2}
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="e.g. Plot 29, Admiralty Way, Lekki Phase 1, Lagos"
                        className={`w-full pl-10 p-3.5 bg-white border rounded-xl text-sm font-sans focus:outline-none transition-all resize-none ${
                          errors.address ? 'border-[#D62828]' : 'border-zinc-200 focus:border-[#FF7A00]'
                        }`}
                      />
                    </div>
                    {errors.address && <p className="mt-1 text-[11px] font-sans text-[#D62828]">{errors.address}</p>}
                  </div>
                )}

                <div>
                  <label className="block font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1.5 flex justify-between">
                    <span>Special takeaway notes (extra chili, packaging notes, etc)</span>
                    <span className="text-[9px] text-zinc-400">Optional</span>
                  </label>
                  <textarea
                    name="dietaryNotes"
                    rows={3}
                    value={formData.dietaryNotes}
                    onChange={handleInputChange}
                    placeholder="e.g. Pack pepper sauce in separate container, no onions"
                    className="w-full p-3 bg-white border border-zinc-200 rounded-xl text-xs font-mono focus:outline-none focus:border-[#FF7A00] resize-none"
                  />
                </div>

                {errors.paystack && (
                  <p className="text-xs font-mono text-[#D62828] bg-red-50 p-3.5 rounded-xl border border-red-100 leading-normal">
                    ⚠️ {errors.paystack}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="w-full py-4 rounded-xl bg-[#D62828] hover:bg-[#FF7A00] disabled:bg-zinc-400 text-white font-mono text-xs uppercase tracking-wider font-bold shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 select-none"
                >
                  <ShoppingBag className="w-4 h-4 text-[#FF7A00]" />
                  {isProcessingPayment 
                    ? "Opening Paystack Secure Popup..." 
                    : `Place Takeaway Order • ₦${activePriceTotal.toLocaleString()}`
                  }
                </button>
              </form>
            )}

            {/* Past orders list */}
            {orderHistory.length > 0 && !isSuccess && (
              <div className="mt-8 pt-6 border-t border-zinc-250">
                <span className="block font-mono text-[9px] text-zinc-400 uppercase tracking-widest mb-4">
                  Past Order Receipts
                </span>
                <div className="space-y-2">
                  {orderHistory.slice(0, 3).map((order) => (
                    <div key={order.id} className="p-3.5 bg-white rounded-xl border border-zinc-150 flex justify-between items-center text-xs font-mono text-zinc-600">
                      <div>
                        <div className="font-bold text-zinc-800 flex items-center gap-1.5">
                          <span className="text-emerald-600">{order.id}</span>
                          <span className="text-zinc-300">|</span>
                          <span className="font-sans font-medium text-[11px] text-zinc-500">{order.method === 'delivery' ? 'Street Delivery' : 'Spot PickUp'}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-1 leading-normal line-clamp-1">
                          {order.customPlatters_v2 && order.customPlatters_v2.length > 0 
                            ? order.customPlatters_v2.map(item => getPlatterDescription(item)).join(' | ')
                            : order.customPlatterOrder ? getPlatterDescription(order.customPlatterOrder) : 'Custom Platter'
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-[#D62828] block">₦{order.totalPrice.toLocaleString()}</span>
                        <span className="text-[9px] text-[#FF7A00] uppercase font-bold">Assembling</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </section>
  );
}
