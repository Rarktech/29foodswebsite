import React, { useState } from 'react';
import { ActiveDishId, PlatterConfiguration } from '../types';
import { Check, Sparkles, ShoppingBag, ShoppingCart, Plus, Minus, Info, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getApiUrl } from '../utils/api';

interface InteractiveMenuProps {
  platterConfig: PlatterConfiguration;
  setPlatterConfig: React.Dispatch<React.SetStateAction<PlatterConfiguration>>;
  cart: PlatterConfiguration[];
  setCart: React.Dispatch<React.SetStateAction<PlatterConfiguration[]>>;
  onInstantCheckout: () => void;
}

export interface DishItem {
  id: string;
  name: string;
  category: 'main_meals' | 'shawarma' | 'chips' | 'noodles' | 'drinks' | 'sandwich' | 'frankfurter';
  description: string;
  basePrice: number;
  calories: string;
  spicyLevel: number;
  plainImage: string;
  dodoImage?: string;
  features: string[];
}

export interface ToppingItem {
  id: string;
  name: string;
  price: number;
  emoji: string;
}

export let SIDE_MEALS_TOPPINGS: ToppingItem[] = [
  { id: 'plantain', name: 'Plantain (Dodo)', price: 800, emoji: '🍌' },
  { id: 'salad', name: 'Salad portion', price: 800, emoji: '🥗' },
  { id: 'egg', name: 'Boiled/Fried Egg', price: 400, emoji: '🍳' },
  { id: 'hotdog', name: 'Hotdog', price: 500, emoji: '🌭' },
  { id: 'moimoi', name: 'Moi Moi wrap', price: 900, emoji: '🫔' },
  { id: 'turkey', name: 'Turkey portion', price: 4500, emoji: '🍗' },
  { id: 'chicken', name: 'Chicken portion', price: 1800, emoji: '🍗' },
  { id: 'beef', name: 'A portion of Beef', price: 1800, emoji: '🥩' },
  { id: 'caramel_chicken', name: 'Caramel Chicken', price: 2100, emoji: '🍗' },
  { id: 'peppered_chicken', name: 'Peppered Chicken', price: 2200, emoji: '🌶️' },
  { id: 'peppered_beef', name: 'Peppered Beef', price: 2200, emoji: '🌶️' },
  { id: 'peppered_turkey', name: 'Peppered Turkey', price: 5000, emoji: '🌶️' },
  { id: 'popcorn', name: 'Popcorn', price: 800, emoji: '🍿' }
];

export let MASTER_DISHES: DishItem[] = [
  // FOOD/MAIN MEALS
  {
    id: 'rice_chicken_beef',
    name: 'Jollof/Fried Rice & Chicken/Beef',
    category: 'main_meals',
    description: 'Our award-winning Nigerian firewood-style rice served with your choice of protein.',
    basePrice: 3800,
    calories: '680 kcal',
    spicyLevel: 2,
    plainImage: '/src/assets/images/jollof_plain_1781261864825.jpg',
    dodoImage: '/src/assets/images/jollof_dodo_1781261920626.jpg',
    features: ['Ember-roasted aroma', 'Double pepper slurry', 'Choice of Beef or Chicken']
  },
  {
    id: 'spaghetti_chicken_beef',
    name: 'Spaghetti & Chicken/Beef',
    category: 'main_meals',
    description: 'Savory stir-fried long-strand pasta simmered in rich pepper tomato sauce.',
    basePrice: 3600,
    calories: '610 kcal',
    spicyLevel: 2,
    plainImage: '/src/assets/images/spaghetti_plain_1781261959247.jpg',
    dodoImage: '/src/assets/images/spaghetti_dodo_1781261974936.jpg',
    features: ['Scotch bonnet glaze', 'Stir-fried durum paste', 'Savory seasoning']
  },
  {
    id: 'rice_turkey',
    name: 'Jollof/Fried Rice & Turkey',
    category: 'main_meals',
    description: 'Woodfire long grain rice served with grilled or fried giant seasoned Turkey.',
    basePrice: 7000,
    calories: '890 kcal',
    spicyLevel: 2,
    plainImage: '/src/assets/images/jollof_plain_1781261864825.jpg',
    dodoImage: '/src/assets/images/jollof_dodo_1781261920626.jpg',
    features: ['Crisp golden turkey side', 'Smoky rice base', 'Rich native sauce']
  },
  {
    id: 'spaghetti_turkey',
    name: 'Spaghetti & Turkey',
    category: 'main_meals',
    description: 'Durum tomato spaghetti skillet stir-fry set alongside a portion of our golden-fried Turkey.',
    basePrice: 6800,
    calories: '830 kcal',
    spicyLevel: 2,
    plainImage: '/src/assets/images/spaghetti_plain_1781261959247.jpg',
    dodoImage: '/src/assets/images/spaghetti_dodo_1781261974936.jpg',
    features: ['Hearty Turkey wing', 'Bold bell pepper reduction', 'Dynamic spice profile']
  },
  {
    id: 'yam_egg_sauce',
    name: 'Boiled Yam & Egg Sauce',
    category: 'main_meals',
    description: 'Traditional native white yams boiled fluffy soft, accompanied by seasoned tomato egg scramble.',
    basePrice: 3700,
    calories: '530 kcal',
    spicyLevel: 1,
    plainImage: '/src/assets/images/boiled_yam_eggsauce_1781260539426.jpg',
    dodoImage: '/src/assets/images/yam_egg_dodo_1781261903040.jpg',
    features: ['Buttery yam slices', 'Farm-fresh country egg sauce', 'Scallion garnish']
  },
  {
    id: 'fried_yam_egg_sauce',
    name: 'Fried Yam & Egg Sauce',
    category: 'main_meals',
    description: 'Crispiest hand-sliced sweet organic yams fried golden, with hot tomato scrambled egg sauce.',
    basePrice: 4000,
    calories: '590 kcal',
    spicyLevel: 1,
    plainImage: '/src/assets/images/boiled_yam_eggsauce_1781260539426.jpg',
    dodoImage: '/src/assets/images/yam_egg_dodo_1781261903040.jpg',
    features: ['Crispy crunchy shell', 'Savory onion tomato egg', 'Hot woodside style']
  },
  {
    id: 'sweet_potato_egg',
    name: 'Sweet Potato & Egg Sauce',
    category: 'main_meals',
    description: 'Soft-boiled native sweet potatoes served alongside spiced tomato-onion country egg sauce.',
    basePrice: 3300,
    calories: '490 kcal',
    spicyLevel: 1,
    plainImage: '/src/assets/images/boiled_yam_eggsauce_1781260539426.jpg',
    dodoImage: '/src/assets/images/yam_egg_dodo_1781261903040.jpg',
    features: ['Caramel tones', 'Savory egg balance', 'Earthy spices']
  },
  {
    id: 'plantain_egg_sauce',
    name: 'Plantain & Egg Sauce',
    category: 'main_meals',
    description: 'Gently steamed or fried sweet plantain slices accompanied by savory scrambled country eggs.',
    basePrice: 3300,
    calories: '510 kcal',
    spicyLevel: 1,
    plainImage: '/src/assets/images/yam_egg_dodo_1781261903040.jpg',
    features: ['Rich caramelized sweetness', 'Creamy country egg stew', 'Spring onions']
  },
  {
    id: 'fries_pepper_sauce',
    name: 'Fries & Peppered Sauce Pack',
    category: 'main_meals',
    description: 'Golden-crisp hand-chopped French potatoes loaded with our signature spicy red pepper base.',
    basePrice: 3300,
    calories: '440 kcal',
    spicyLevel: 3,
    plainImage: '/src/assets/images/chicken_chips_topdown_1781279971163.jpg',
    features: ['Fresh potato fries', 'Stove-cooked pepper paste', 'Extra crunch']
  },

  // SHAWARMA
  {
    id: 'small_beef_shawarma',
    name: 'Small Beef Shawarma',
    category: 'shawarma',
    description: 'Toasted flatbread wrap filled with wood-grilled spiced shaved beef and garlic mayo sauce.',
    basePrice: 2800,
    calories: '410 kcal',
    spicyLevel: 1,
    plainImage: '/src/assets/images/shawarma_plain_1781261987810.jpg',
    dodoImage: '/src/assets/images/shawarma_dodo_1781262003933.jpg',
    features: ['Woodfire beef slices', 'Garlic paste', 'Toasted flatbread wrap']
  },
  {
    id: 'big_beef_shawarma',
    name: 'Big Beef Shawarma',
    category: 'shawarma',
    description: 'An upgraded size of our classic loaded spiced beef wrap with shredded fresh purple cabbage.',
    basePrice: 3100,
    calories: '550 kcal',
    spicyLevel: 1,
    plainImage: '/src/assets/images/shawarma_plain_1781261987810.jpg',
    dodoImage: '/src/assets/images/shawarma_dodo_1781262003933.jpg',
    features: ['Double meat portions', 'Aromatic spices', 'Cabbage shreddings']
  },
  {
    id: 'special_beef_shawarma',
    name: 'Special Beef Shawarma',
    category: 'shawarma',
    description: 'Gourmet sliced roasted beef, loaded flatbread wrap with our private chili-herb cream.',
    basePrice: 3400,
    calories: '620 kcal',
    spicyLevel: 2,
    plainImage: '/src/assets/images/shawarma_plain_1781261987810.jpg',
    dodoImage: '/src/assets/images/shawarma_dodo_1781262003933.jpg',
    features: ['Cheddar-infused melt option', 'Extra premium beef', 'Fragrant roasted onion']
  },
  {
    id: 'small_ch_shawarma',
    name: 'Small Chicken Shawarma',
    category: 'shawarma',
    description: 'Toasted flatbread rolled around wood-grilled marinated shaver chicken breasts, with garlic toum.',
    basePrice: 3000,
    calories: '450 kcal',
    spicyLevel: 1,
    plainImage: '/src/assets/images/shawarma_plain_1781261987810.jpg',
    dodoImage: '/src/assets/images/shawarma_dodo_1781262003933.jpg',
    features: ['Premium garlic toum', 'Herbaceous marinades', 'Perfect single size']
  },
  {
    id: 'big_ch_shawarma',
    name: 'Big Chicken Shawarma',
    category: 'shawarma',
    description: 'Our standard best-seller size wrap with double shaved country chicken breast bits and seasoning.',
    basePrice: 3300,
    calories: '590 kcal',
    spicyLevel: 1,
    plainImage: '/src/assets/images/shawarma_plain_1781261987810.jpg',
    dodoImage: '/src/assets/images/shawarma_dodo_1781262003933.jpg',
    features: ['Double breast shred', 'Signature spice rub', 'Thin crisped wrap']
  },
  {
    id: 'special_ch_shawarma',
    name: 'Special Chicken Shawarma',
    category: 'shawarma',
    description: 'Double chicken wrap enhanced with caramelized onions and a secret house dressing.',
    basePrice: 3600,
    calories: '660 kcal',
    spicyLevel: 2,
    plainImage: '/src/assets/images/shawarma_plain_1781261987810.jpg',
    dodoImage: '/src/assets/images/shawarma_dodo_1781262003933.jpg',
    features: ['Sweet caramelized onions', 'House mustard-mayo mix', 'Extra charred flavor']
  },
  {
    id: 'royal_shawarma',
    name: 'Royal Shawarma Wrapper',
    category: 'shawarma',
    description: 'The ultimate size! Chicken, beef, hotdogs, and extra cheese rolled in a premium crispy pita.',
    basePrice: 4000,
    calories: '890 kcal',
    spicyLevel: 2,
    plainImage: '/src/assets/images/shawarma_plain_1781261987810.jpg',
    dodoImage: '/src/assets/images/shawarma_dodo_1781262003933.jpg',
    features: ['Double protein hybrid', 'Premium hotdog slice', 'Cheddar cheese core']
  },

  // NOODLES
  {
    id: 'noodles_egg',
    name: 'Noodles & Egg',
    category: 'noodles',
    description: 'Aromatic express noodles cooked in spice broth, crowned with a fried or boiled farm egg.',
    basePrice: 2500,
    calories: '490 kcal',
    spicyLevel: 2,
    plainImage: '/src/assets/images/noodles_topdown_1781279953591.jpg',
    features: ['Spiced soup glaze', 'Perfect farm egg', 'Scallion garnish']
  },
  {
    id: 'noodles_meat',
    name: 'Noodles & Chicken/Beef',
    category: 'noodles',
    description: 'Durum instant wok-tossed noodles mixed with finely sliced grilled chicken breast or beef.',
    basePrice: 3000,
    calories: '580 kcal',
    spicyLevel: 2,
    plainImage: '/src/assets/images/noodles_topdown_1781279953591.jpg',
    features: ['Stir-fried vegetables', 'Slivered protein slices', 'Bold native seasoning']
  },
  {
    id: 'noodles_egg_meat',
    name: 'Noodles, Egg & Chicken/Beef',
    category: 'noodles',
    description: 'Noodles wok-tossed with fresh vegetables, spiced egg, and tender chicken chunks or beef.',
    basePrice: 3300,
    calories: '640 kcal',
    spicyLevel: 2,
    plainImage: '/src/assets/images/noodles_topdown_1781279953591.jpg',
    features: ['Three-in-one feast', 'Carrot & carrot slivers', 'Signature chili oil']
  },
  {
    id: 'noodles_turkey',
    name: 'Noodles & Turkey portion',
    category: 'noodles',
    description: 'Steaming spiced noodles plated elegantly with a massive portion of peppered crispy Turkey.',
    basePrice: 6200,
    calories: '850 kcal',
    spicyLevel: 2,
    plainImage: '/src/assets/images/noodles_topdown_1781279953591.jpg',
    features: ['Crisp Turkey wing', 'Wok-broth reduction', 'Fragrant herbs']
  },
  {
    id: 'noodles_egg_turkey',
    name: 'Noodles, Egg & Turkey portion',
    category: 'noodles',
    description: 'Gourmet noodles plate with a rich spiced egg and full golden-brown Turkey wing.',
    basePrice: 6500,
    calories: '910 kcal',
    spicyLevel: 2,
    plainImage: '/src/assets/images/noodles_topdown_1781279953591.jpg',
    features: ['Ultimate noodles combo', 'Peppered sauce splash', 'Rich local spices']
  },

  // CHICKEN & CHIPS
  {
    id: 'small_chicken_chips',
    name: 'Chicken & Chips (Small)',
    category: 'chips',
    description: 'Crispy thick-cut french fries paired with a golden deep-fried country chicken portion.',
    basePrice: 3500,
    calories: '550 kcal',
    spicyLevel: 1,
    plainImage: '/src/assets/images/chicken_chips_topdown_1781279971163.jpg',
    features: ['Hand-sliced potatoes', 'Golden chicken thigh', 'Sweet pepper catchup']
  },
  {
    id: 'big_chicken_chips',
    name: 'Chicken & Chips (Big Pack)',
    category: 'chips',
    description: 'Large family thermal pack of spiced crispy chips alongside double fried chicken drumsticks.',
    basePrice: 4200,
    calories: '790 kcal',
    spicyLevel: 1,
    plainImage: '/src/assets/images/chicken_chips_topdown_1781279971163.jpg',
    features: ['Double chicken pieces', 'Extra crisp fries', 'Creamy dip sauce']
  },
  {
    id: 'special_chicken_chips',
    name: 'Chicken & Chips (Special)',
    category: 'chips',
    description: 'Our ultimate chip pack with our premium glazed peppered or caramel-roasted giant double chicken.',
    basePrice: 5000,
    calories: '890 kcal',
    spicyLevel: 2,
    plainImage: '/src/assets/images/chicken_chips_topdown_1781279971163.jpg',
    features: ['Peppered or Caramel glazed', 'Wood-roasted aromatics', 'Gourmet packaging']
  },

  // FRANKFURTER
  {
    id: 'small_frankfurter',
    name: 'Small Frankfurter hotdog',
    category: 'frankfurter',
    description: 'Grilled premium sausage inside a warm bun with yellow mustard swirl.',
    basePrice: 1600,
    calories: '310 kcal',
    spicyLevel: 1,
    plainImage: '/src/assets/images/frankfurter_topdown_1781279989077.jpg',
    features: ['Toasted brioche bun', 'Signature mustard drizzle', 'Sweet relish']
  },
  {
    id: 'big_frankfurter',
    name: 'Big Double Frankfurter',
    category: 'frankfurter',
    description: 'Giant dual grilled high-grade sausages, toasted split-bun with dynamic chili toppings.',
    basePrice: 2000,
    calories: '480 kcal',
    spicyLevel: 2,
    plainImage: '/src/assets/images/frankfurter_topdown_1781279989077.jpg',
    features: ['Double giant sausage', 'Tomato bell pepper chutney', 'Caramelized onion']
  },

  // SANDWICH
  {
    id: 'beef_sandwich',
    name: 'Classic Beef Sandwich',
    category: 'sandwich',
    description: 'Double toasted bread loaded with wood-grilled sliced beef, cheddar cheese, lettuce, and tomatoes.',
    basePrice: 2700,
    calories: '490 kcal',
    spicyLevel: 1,
    plainImage: '/src/assets/images/sandwich_topdown_1781280005287.jpg',
    features: ['Grilled beef patty cuts', 'Sharp cheddar melt', 'Organic crisp romaine']
  },
  {
    id: 'chicken_sandwich',
    name: 'Classic Chicken Sandwich',
    category: 'sandwich',
    description: 'Gourmet layered sandwich with chicken cuts, scrambled cream egg, and fresh green dressing.',
    basePrice: 3200,
    calories: '540 kcal',
    spicyLevel: 1,
    plainImage: '/src/assets/images/sandwich_topdown_1781280005287.jpg',
    features: ['Shredded chicken cream', 'Triple high toaster deck', 'Fresh basil pesto mayo']
  },

  // DRINKS
  {
    id: 'sweet_tooth_smoothie',
    name: 'Sweet Tooth Smoothie',
    category: 'drinks',
    description: 'Blend of pureed strawberries, honey, and Greek yogurt to satisfy sugar cravings.',
    basePrice: 3000,
    calories: '280 kcal',
    spicyLevel: 0,
    plainImage: '/src/assets/images/signature_platter_1781259994332.jpg',
    features: ['All organic honey', 'Vibrant berry extract', 'Served child-cold']
  },
  {
    id: 'milkshake',
    name: 'Thick Vanilla Milkshake',
    category: 'drinks',
    description: 'Chilled cream double-churned vanilla bean classic topped with dark cocoa shreds.',
    basePrice: 4000,
    calories: '410 kcal',
    spicyLevel: 0,
    plainImage: '/src/assets/images/signature_platter_1781259994332.jpg',
    features: ['Double cream churn', 'Bourbon vanilla beans', 'Hand-shaved chocolate']
  },
  {
    id: 'protein_shake',
    name: 'Double-Shot Protein Shake',
    category: 'drinks',
    description: 'High-performance post-workout isolate fuel with peanut butter and organic banana.',
    basePrice: 4500,
    calories: '350 kcal',
    spicyLevel: 0,
    plainImage: '/src/assets/images/signature_platter_1781259994332.jpg',
    features: ['Pure gold isolate whey', 'Organic peanut paste', 'Banana smooth crush']
  },
  {
    id: 'parfait',
    name: 'Creamy Fruit Yogurt Parfait',
    category: 'drinks',
    description: 'Layers of premium thick sweetened yogurt, loaded with granola flakes and local Abakaliki fruits.',
    basePrice: 4000,
    calories: '330 kcal',
    spicyLevel: 0,
    plainImage: '/src/assets/images/signature_platter_1781259994332.jpg',
    features: ['Honey roasted oats', 'Abakaliki garden berries', 'Layered presentation']
  }
];

export default function InteractiveMenu({
  platterConfig,
  setPlatterConfig,
  cart,
  setCart,
  onInstantCheckout,
}: InteractiveMenuProps) {
  
  const [activeCategory, setActiveCategory] = useState<'all' | 'main_meals' | 'shawarma' | 'chips' | 'noodles' | 'sandwich' | 'frankfurter' | 'drinks'>('all');
  const [showAddBanner, setShowAddBanner] = useState(false);
  const [activeOwnerName, setActiveOwnerName] = useState('');
  const [dishesList, setDishesList] = useState<DishItem[]>(MASTER_DISHES);
  const [toppingsList, setToppingsList] = useState<ToppingItem[]>(SIDE_MEALS_TOPPINGS);

  // Poll for dynamic menu and toppings database updates from Express/Supabase backend
  React.useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch(getApiUrl('/api/menu'));
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setDishesList(data);
            // Reassign exported reference so the rest of the application imports get updated dishes too!
            MASTER_DISHES.length = 0;
            MASTER_DISHES.push(...data);
          }
        }
      } catch (err) {
        console.warn("Backend API offline - operating in local simulated mode with default menu", err);
      }
    };

    const fetchToppings = async () => {
      try {
        const res = await fetch(getApiUrl('/api/toppings'));
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setToppingsList(data);
            // Reassign the exported reference so other imports see the changes!
            SIDE_MEALS_TOPPINGS.length = 0;
            SIDE_MEALS_TOPPINGS.push(...data);
          }
        }
      } catch (err) {
        console.warn("Backend API offline - operating in local simulated mode with default toppings", err);
      }
    };

    fetchMenu();
    fetchToppings();
    const interval = setInterval(() => {
      fetchMenu();
      fetchToppings();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Helper to compute a platter's price
  const getPlatterPrice = (cfg: PlatterConfiguration) => {
    const dish = dishesList.find(d => d.id === cfg.dishId) || dishesList[0] || MASTER_DISHES[0];
    const toppingsPrice = (cfg.selectedToppingIds || []).reduce((sum, id) => {
      const topping = toppingsList.find(t => t.id === id);
      const qty = cfg.toppingQuantities?.[id] ?? 1;
      return sum + (topping ? topping.price * qty : 0);
    }, 0);
    return (dish.basePrice + toppingsPrice) * cfg.quantity;
  };

  const handleAddPlatterToCart = () => {
    const itemToSave: PlatterConfiguration = {
      dishId: platterConfig.dishId,
      hasPlantain: platterConfig.hasPlantain,
      selectedToppingIds: [...(platterConfig.selectedToppingIds || [])],
      toppingQuantities: platterConfig.toppingQuantities ? { ...platterConfig.toppingQuantities } : {},
      quantity: platterConfig.quantity,
      ownerName: activeOwnerName.trim() || undefined,
    };

    setCart(prev => [...prev, itemToSave]);
    setActiveOwnerName('');
    
    // Reset active config back to default so they can design a new one
    setPlatterConfig({
      dishId: 'rice_chicken_beef',
      selectedToppingIds: [],
      toppingQuantities: {},
      hasPlantain: false,
      quantity: 1,
    });

    setShowAddBanner(true);
    setTimeout(() => {
      setShowAddBanner(false);
    }, 3000);
  };

  const handleRemoveCartItem = (index: number) => {
    setCart(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateCartItemQty = (index: number, delta: number) => {
    setCart(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      const newQty = Math.max(1, item.quantity + delta);
      return { ...item, quantity: newQty };
    }));
  };

  const cartTotalPrice = cart.reduce((sum, item) => sum + getPlatterPrice(item), 0);

  const filteredDishes = activeCategory === 'all' 
    ? dishesList 
    : dishesList.filter(d => d.category === activeCategory);

  const activeDish = dishesList.find(d => d.id === platterConfig.dishId) || dishesList[0] || MASTER_DISHES[0];

  const handleSelectDish = (dishId: string) => {
    setPlatterConfig(prev => ({
      ...prev,
      dishId,
    }));
  };

  const handleToggleTopping = (toppingId: string) => {
    setPlatterConfig(prev => {
      const selected = prev.selectedToppingIds || [];
      const isAlreadyAdded = selected.includes(toppingId);
      const quantities = prev.toppingQuantities || {};
      
      let updated: string[];
      const updatedQuantities = { ...quantities };

      if (isAlreadyAdded) {
        updated = selected.filter(id => id !== toppingId);
        delete updatedQuantities[toppingId];
      } else {
        updated = [...selected, toppingId];
        updatedQuantities[toppingId] = 1;
      }
      const hasPlantainUpdated = updated.includes('plantain');
      return {
        ...prev,
        selectedToppingIds: updated,
        toppingQuantities: updatedQuantities,
        hasPlantain: hasPlantainUpdated
      };
    });
  };

  const handleUpdateToppingQuantity = (toppingId: string, delta: number) => {
    setPlatterConfig(prev => {
      const selected = prev.selectedToppingIds || [];
      const quantities = prev.toppingQuantities || {};
      const currentQty = quantities[toppingId] || 0;
      const newQty = currentQty + delta;
      
      let updated = [...selected];
      const updatedQuantities = { ...quantities };

      if (newQty <= 0) {
        updated = selected.filter(id => id !== toppingId);
        delete updatedQuantities[toppingId];
      } else {
        if (!selected.includes(toppingId)) {
          updated.push(toppingId);
        }
        updatedQuantities[toppingId] = newQty;
      }

      const hasPlantainUpdated = updated.includes('plantain');
      return {
        ...prev,
        selectedToppingIds: updated,
        toppingQuantities: updatedQuantities,
        hasPlantain: hasPlantainUpdated
      };
    });
  };

  const toppingsPrice = (platterConfig.selectedToppingIds || []).reduce((sum, id) => {
    const topping = toppingsList.find(t => t.id === id);
    const qty = platterConfig.toppingQuantities?.[id] ?? 1;
    return sum + (topping ? topping.price * qty : 0);
  }, 0);

  const currentPriceTotal = (activeDish.basePrice + toppingsPrice) * platterConfig.quantity;

  // Active plate image depends solely on user's platter view, without updating general catalogue cards
  const hasPlantainOnPlatter = (platterConfig.selectedToppingIds || []).includes('plantain');
  const activePlateImage = (hasPlantainOnPlatter && activeDish.dodoImage) 
    ? activeDish.dodoImage 
    : activeDish.plainImage;

  // Smooth scroll handler to checkout panel
  const handleCheckoutClick = () => {
    onInstantCheckout();
    const el = document.getElementById('booking-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-24 bg-white relative" id="menu-section">
      
      {/* 29foods Floating Mobile/Tablet Sticky Dock (Bottom of Screen) */}
      <div className="fixed bottom-6 inset-x-6 z-50 block lg:hidden pointer-events-none">
        <AnimatePresence>
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-md mx-auto pointer-events-auto p-4 rounded-2xl bg-zinc-950 text-white border border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between gap-4"
          >
            {cart.length > 0 ? (
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-zinc-750 bg-zinc-900 flex-shrink-0 flex items-center justify-center text-xs font-mono font-bold text-[#FF7A00]">
                  🛒 {cart.reduce((s, i) => s + i.quantity, 0)}
                </div>
                <div className="text-left">
                  <h5 className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest leading-none">Tray Basket active</h5>
                  <h4 className="text-xs font-bold font-sans mt-1">{cart.length} Custom Platter{cart.length > 1 ? 's' : ''}</h4>
                  <div className="text-[10px] font-mono text-[#D62828] mt-0.5 font-bold">
                    ₦{cartTotalPrice.toLocaleString()} total
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-zinc-750 bg-zinc-900 flex-shrink-0">
                  <img 
                    src={activePlateImage} 
                    alt={activeDish.name}
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="text-left">
                  <h5 className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest line-clamp-1">Custom Platter</h5>
                  <h4 className="text-xs font-bold font-sans line-clamp-1">{activeDish.name}</h4>
                  <div className="text-[10px] font-mono text-[#FF7A00] mt-0.5 font-bold">
                    ₦{currentPriceTotal.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleCheckoutClick}
              className="px-4 py-2.5 rounded-xl bg-[#D62828] hover:bg-[#FF7A00] text-white font-mono text-[10px] uppercase font-bold tracking-wider transition-colors duration-200"
            >
              Checkout Order
            </button>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        
        {/* Editorial header */}
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-16 pb-8 border-b border-zinc-150">
          <div>
            <span className="font-mono text-xs text-zinc-400 tracking-wider">01 // SELECT YOUR SAVORY PLATTER</span>
            <h2 className="mt-2 text-4xl md:text-5xl font-foody font-semibold text-[#111111]">
              Browse <span className="font-serif italic font-medium text-[#D62828]">The Food Rooms</span>
            </h2>
          </div>
          <p className="mt-4 md:mt-0 max-w-sm text-sm text-zinc-500 font-sans leading-relaxed">
            Select any dish from our core woodfire menu and pile your platter high with real takeaway side portions. Only the live viewer adapts, keeping the menu cards completely clean!
          </p>
        </div>

        {/* Categories Menu Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-12">
          {([
            { id: 'all', title: '🎛️ Full Menu' },
            { id: 'main_meals', title: '🍛 Main Meals' },
            { id: 'shawarma', title: '🌯 Shawarma Wraps' },
            { id: 'noodles', title: '🍜 Noodles' },
            { id: 'chips', title: '🍗 Chicken & Chips' },
            { id: 'sandwich', title: '🥪 Sandwiches' },
            { id: 'frankfurter', title: '🌭 Frankfurters' },
            { id: 'drinks', title: '🍹 Shakes & Smoothies' }
          ] as const).map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-[10px] font-mono tracking-wide transition-all border ${
                  isActive 
                    ? 'bg-[#111111] text-white border-[#111111] shadow-sm' 
                    : 'bg-zinc-50 text-zinc-650 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                {cat.title}
              </button>
            );
          })}
        </div>

        {/* Column Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch relative">
          
          {/* Main Food Selection Board - 7 Columns */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <span className="block font-mono text-[9px] text-zinc-400 uppercase tracking-widest pb-3 border-b border-zinc-100 mb-6">
                Active Catalogue // Select a dish to begin
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredDishes.map((dish) => {
                  const isSelected = platterConfig.dishId === dish.id;
                  // ALWAYS use pristine base plainImage in the cards to solve:
                  // "addons was added and the entire category catalogue shouldnt update what the side meal or addons was added"
                  const pristinePreviewImage = dish.plainImage;

                  return (
                    <div
                      key={dish.id}
                      id={`dish-card-${dish.id}`}
                      onClick={() => handleSelectDish(dish.id)}
                      className={`p-4 rounded-3xl border text-left cursor-pointer transition-all duration-300 relative group select-none ${
                        isSelected 
                          ? 'border-[#D62828] bg-red-50/10 shadow-md' 
                          : 'border-zinc-200 hover:border-zinc-300 bg-white'
                      }`}
                    >
                      {/* Visual box image aspect 4:3 as standard */}
                      <div className="aspect-video w-full rounded-2xl overflow-hidden relative bg-zinc-100 shadow-inner">
                        <img 
                          src={pristinePreviewImage} 
                          alt={dish.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2.5 right-2.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono text-white font-bold">
                          ₦{dish.basePrice.toLocaleString()}
                        </div>
                      </div>

                      <div className="mt-3.5 space-y-1">
                        <div className="flex justify-between items-center">
                          <h4 className="font-foody text-base font-bold text-zinc-950">
                            {dish.name}
                          </h4>
                          {isSelected && (
                            <div className="w-4.5 h-4.5 rounded-full bg-[#D62828] flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[4px] text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 font-sans leading-relaxed line-clamp-2">
                          {dish.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-3 border-t border-zinc-100 flex justify-between items-center text-[9px] font-mono text-zinc-400 uppercase">
                        <span>{dish.calories}</span>
                        {isSelected ? (
                          <div className="flex items-center gap-2 mt-[-4px]" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[10px] font-mono font-bold text-zinc-650 tracking-wider">Copies:</span>
                            <div className="flex items-center gap-1.5 bg-zinc-100 border border-zinc-205 rounded-md p-0.5">
                              <button
                                type="button"
                                disabled={platterConfig.quantity <= 1}
                                onClick={() => setPlatterConfig(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                                className="w-5 h-5 rounded text-zinc-700 flex items-center justify-center font-bold text-[10px] disabled:opacity-35 hover:bg-zinc-200 transition-colors"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="font-mono text-[10px] font-bold text-zinc-950 px-1">{platterConfig.quantity}</span>
                              <button
                                type="button"
                                onClick={() => setPlatterConfig(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                                className="w-5 h-5 rounded text-zinc-700 flex items-center justify-center font-bold text-[10px] hover:bg-zinc-200 transition-colors"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#FF7A00] font-bold">
                            Tap to select
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DYNAMIC COMBINATION WOODFIRE TOPPINGS & ADD-ONS DRAWER */}
            <div className="p-6 md:p-8 rounded-3xl bg-zinc-50 border border-zinc-150 space-y-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF7A00]" />
                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                  Side Meals &amp; Toppings Catalogue
                </span>
              </div>
              <div>
                <h4 className="font-foody text-xl text-zinc-900 leading-tight">
                  Customize Platter Add-ons // Spot Extras
                </h4>
                <p className="text-xs text-zinc-500 font-sans leading-relaxed mt-1">
                  Identify and append delicious side portions of Dodo, Eggs sauce, hotdogs or extra roasted chicken. Your additions are reflected exclusively on the Live Platter card!
                </p>
              </div>

              {/* Toppings Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {toppingsList.map((topping) => {
                  const isChecked = (platterConfig.selectedToppingIds || []).includes(topping.id);
                  const qty = platterConfig.toppingQuantities?.[topping.id] ?? 0;

                  return (
                    <div
                      key={topping.id}
                      onClick={() => {
                        if (!isChecked) {
                          handleToggleTopping(topping.id);
                        }
                      }}
                      className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all duration-200 select-none cursor-pointer ${
                        isChecked
                          ? 'bg-orange-50/70 border-[#FF7A00] text-zinc-900 shadow-sm'
                          : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 flex-shrink-0 mt-0.5 rounded overflow-hidden flex items-center justify-center bg-zinc-50">
                          {topping.image ? (
                            <img src={topping.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="text-lg">{topping.emoji}</div>
                          )}
                        </div>
                        <div className="flex-1 text-left space-y-0.5">
                          <div className="text-xs font-bold leading-tight line-clamp-1">{topping.name}</div>
                          <div className="text-[10px] font-mono text-[#D62828] font-bold">
                            +₦{topping.price.toLocaleString()}
                          </div>
                        </div>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTopping(topping.id);
                          }}
                          className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center mt-1 transition-all ${
                            isChecked ? 'bg-[#FF7A00] border-[#FF7A00]' : 'border-zinc-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-2.5 h-2.5 text-white stroke-[4px]" />}
                        </div>
                      </div>

                      {/* Small inline stepper row if selected */}
                      {isChecked && (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-between pt-2 border-t border-orange-100/50 mt-1"
                        >
                          <span className="text-[9px] font-mono text-orange-700 font-semibold uppercase">Addon Copies:</span>
                          <div className="flex items-center gap-1.5 bg-white border border-orange-200 rounded-md p-0.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateToppingQuantity(topping.id, -1)}
                              className="w-4.5 h-4.5 rounded text-orange-700 flex items-center justify-center font-bold text-[9px] hover:bg-orange-100 transition-colors"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="font-mono text-[10px] font-bold text-zinc-950 px-1 min-w-[12px] text-center">{qty}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateToppingQuantity(topping.id, 1)}
                              className="w-4.5 h-4.5 rounded text-orange-700 flex items-center justify-center font-bold text-[9px] hover:bg-orange-100 transition-colors"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Interactive Billed Platter Checkout Panel & LIVE PLATE VIEW - 5 Columns */}
          {/* Note: sticky configuration spans nicely inside parent flex grid */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24 bg-zinc-950 p-6 md:p-8 rounded-3xl text-white flex flex-col justify-between shadow-xl overflow-visible relative border border-zinc-800">
            
            {/* Woodfire amber light highlight background */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#FF7A00]/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <ShoppingCart className="w-4.5 h-4.5 text-[#FF7A00]" />
                  <span className="font-mono text-xs text-zinc-400 tracking-wider">02 // LIVE PLATTER VIEWER</span>
                </div>
              </div>

              {/* LIVE PLATE PICTURE SPOTLIGHT WITH STEAM EFFECTS */}
              <div className="relative flex flex-col items-center justify-center py-6 mb-8 bg-zinc-900/50 rounded-2xl border border-zinc-850 overflow-visible">
                
                {/* Steam flow elements */}
                <div className="absolute inset-0 pointer-events-none z-10 opacity-70">
                  <motion.div 
                    animate={{ 
                      y: [-10, -50], 
                      x: [-5, 10, -5],
                      opacity: [0, 0.4, 0] 
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-1/4 left-1/3 w-16 h-16 bg-white/5 rounded-full blur-xl"
                  />
                  <motion.div 
                    animate={{ 
                      y: [-15, -60], 
                      x: [10, -10, 10],
                      opacity: [0, 0.5, 0] 
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                    className="absolute bottom-1/4 left-1/2 w-20 h-20 bg-white/5 rounded-full blur-xl"
                  />
                </div>

                {/* Main dynamic plate wrap */}
                <div className="relative w-56 h-56 md:w-64 md:h-64 rounded-full p-2 bg-gradient-to-tr from-zinc-800 to-zinc-900/40 shadow-inner flex items-center justify-center border border-zinc-800 overflow-visible">
                  
                  {/* Backdrop shadow for food depth */}
                  <div className="absolute inset-4 rounded-full bg-black/70 blur-md pointer-events-none" />

                  {/* High precision top-down rotating active plate */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${platterConfig.dishId}_${hasPlantainOnPlatter}`}
                      initial={{ scale: 0.9, rotate: -15, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      exit={{ scale: 0.94, rotate: 15, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 240, damping: 20 }}
                      className="w-full h-full rounded-full overflow-hidden border-4 border-zinc-950 shadow-2xl relative"
                    >
                      <img 
                        src={activePlateImage} 
                        alt={activeDish.name}
                        className="w-full h-full object-cover rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* PHYSICAL TOPPING PARTICLES: Rendered around the circular rim dynamically with Spring physics! */}
                  <AnimatePresence>
                    {(platterConfig.selectedToppingIds || []).map((toppingId, idx) => {
                      const toppingItem = toppingsList.find(t => t.id === toppingId);
                      if (!toppingItem) return null;
                      const qty = platterConfig.toppingQuantities?.[toppingId] ?? 1;
                      
                      // Evenly distribute toppings around the platter circle
                      const totalToppings = platterConfig.selectedToppingIds.length;
                      const angle = (idx * (360 / Math.max(1, totalToppings))) * (Math.PI / 180);
                      const radius = 110; // offset outwards past the black plate
                      const tx = Math.cos(angle) * radius;
                      const ty = Math.sin(angle) * radius;

                      return (
                        <motion.div
                          initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
                          animate={{ scale: 1, opacity: 1, x: tx, y: ty }}
                          exit={{ scale: 0, opacity: 0 }}
                          key={toppingId}
                          className="absolute bg-white text-zinc-950 text-[9px] font-mono font-bold px-2.5 py-1.5 rounded-full border border-orange-200 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] flex items-center gap-1.5 uppercase tracking-tight z-35"
                        >
                          <span className="text-xs flex items-center justify-center">
                            {toppingItem.image ? (
                              <img src={toppingItem.image} className="w-5 h-5 rounded-full object-cover inline-block" referrerPolicy="no-referrer" />
                            ) : (
                              toppingItem.emoji
                            )}
                          </span>
                          <span>{toppingItem.name}{qty > 1 ? ` (x${qty})` : ''}</span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Gloss overlay styling */}
                  <div className="absolute top-2 left-6 w-32 h-6 bg-white/5 rounded-full transform -rotate-12 blur-[1px] pointer-events-none" />
                </div>
              </div>

              <span className="block font-mono text-[9px] text-[#FF7A00] uppercase tracking-widest mb-1.5 flex items-center justify-between">
                <span>02A // ACTIVE PLATTER WORKSPACE</span>
                {platterConfig.quantity > 1 && (
                  <span className="text-white text-[8px] bg-[#D62828] px-1.5 py-0.5 rounded-full font-bold">
                    x{platterConfig.quantity} Copies
                  </span>
                )}
              </span>
              <h4 className="text-lg font-foody font-semibold text-white mb-2 leading-tight">
                Inspect / Assemble active platter
              </h4>

              {/* Package Labeling Name Input */}
              <div className="mb-4 bg-zinc-900/30 p-3 rounded-xl border border-zinc-850/60">
                <label className="block font-mono text-[9px] text-[#FF7A00] uppercase tracking-widest mb-1.5 font-bold">
                  👤 Packaging Label (Whose Platter is this?)
                </label>
                <input
                  type="text"
                  value={activeOwnerName}
                  onChange={(e) => setActiveOwnerName(e.target.value)}
                  placeholder="e.g. Peter, Sis Mary, Dad (Optional, written on container lid)"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#FF7A00] text-zinc-200 placeholder-zinc-600 text-xs rounded-xl px-4 py-2 outline-none font-sans transition-all"
                />
                <p className="text-[9px] text-zinc-500 mt-1 font-sans">
                  Helpful so friends/family know which item belongs to whom when the order arrives.
                </p>
              </div>

              {/* Invoice breakdown slots */}
              <div className="space-y-3 mb-6 bg-zinc-900/40 p-4 rounded-xl border border-zinc-850">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-350 font-sans font-medium flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                    {activeDish.name} (Base Hero){platterConfig.quantity > 1 ? ` (x${platterConfig.quantity})` : ''}
                  </span>
                  <span className="font-mono text-zinc-300">
                    +₦{(activeDish.basePrice * platterConfig.quantity).toLocaleString()}
                  </span>
                </div>

                {/* List chosen toppings in detail */}
                {(platterConfig.selectedToppingIds || []).map((toppingId) => {
                  const topping = toppingsList.find(t => t.id === toppingId);
                  if (!topping) return null;
                  const qty = platterConfig.toppingQuantities?.[toppingId] ?? 1;
                  return (
                    <div key={topping.id} className="flex justify-between items-center text-xs">
                      <span className="text-zinc-350 font-sans font-medium flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                        {topping.name} Side {qty > 1 ? `(x${qty})` : ''}
                      </span>
                      <span className="font-mono text-zinc-300">
                        +₦{(topping.price * qty).toLocaleString()}
                      </span>
                    </div>
                  );
                })}

                <div className="flex justify-between items-center text-xs pt-2.5 border-t border-dashed border-zinc-800">
                  <span className="text-zinc-500 font-sans italic flex items-center gap-1.5">
                    🌿 Fresh Herbaceous Garnish
                  </span>
                  <span className="font-mono text-emerald-500 text-[10px] font-bold">
                    Free
                  </span>
                </div>
              </div>

              {/* Notification Banner */}
              <AnimatePresence>
                {showAddBanner && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 bg-emerald-950/80 border border-emerald-800 p-2.5 rounded-xl text-xs text-emerald-400 flex items-center gap-2 font-mono"
                  >
                    <span>❇️</span>
                    <span>Platter added to Tray Basket!</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Add to Tray Basket Action Button */}
              <button
                type="button"
                onClick={handleAddPlatterToCart}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#D62828] hover:brightness-110 text-white font-mono text-[10px] uppercase font-bold tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] cursor-pointer mb-8"
              >
                <Plus className="w-4 h-4 text-white" />
                Add Platter to Tray Basket (+₦{currentPriceTotal.toLocaleString()})
              </button>

              {/* YOUR TRAY BASKET LIST */}
              {cart.length > 0 && (
                <div className="mt-8 pt-6 border-t border-zinc-800 mb-6">
                  <span className="block font-mono text-[10px] text-[#FF7A00] uppercase tracking-widest mb-3 flex items-center gap-2 font-bold">
                    <ShoppingCart className="w-4 h-4" /> YOUR BASKET ({cart.reduce((s, i) => s + i.quantity, 0)} items)
                  </span>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {cart.map((item, idx) => {
                      const dish = dishesList.find(d => d.id === item.dishId) || dishesList[0] || MASTER_DISHES[0];
                      const toppingsDesc = (item.selectedToppingIds || []).map(tid => {
                        const t = toppingsList.find(topping => topping.id === tid);
                        const qty = item.toppingQuantities?.[tid] ?? 1;
                        return t ? `${t.name}${qty > 1 ? ` (x${qty})` : ''}` : '';
                      }).filter(Boolean).join(', ');

                      return (
                        <div key={idx} className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-between gap-3 text-xs">
                          <div className="flex-1 text-left">
                            <div className="font-sans font-bold text-white line-clamp-1">
                              {dish.name}
                            </div>
                            {item.ownerName && (
                              <div className="inline-block mt-1 bg-orange-950/40 text-orange-400 border border-orange-900/40 text-[9px] px-2 py-0.5 rounded-full font-mono uppercase tracking-wider font-bold">
                                👤 Pack for: {item.ownerName}
                              </div>
                            )}
                            {toppingsDesc && (
                              <div className="text-[10px] text-zinc-400 font-sans line-clamp-1 mt-0.5">
                                + {toppingsDesc}
                              </div>
                            )}
                            <div className="text-[10px] font-mono text-[#FF7A00] mt-1 font-bold">
                              ₦{getPlatterPrice(item).toLocaleString()}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Stepper for tray copies */}
                            <div className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded p-0.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateCartItemQty(idx, -1)}
                                className="w-4.5 h-4.5 rounded text-zinc-300 flex items-center justify-center font-bold text-[9px] hover:bg-zinc-700 transition-colors"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="font-mono text-[10px] font-bold text-white px-0.5 min-w-[12px] text-center">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateCartItemQty(idx, 1)}
                                className="w-4.5 h-4.5 rounded text-zinc-300 flex items-center justify-center font-bold text-[9px] hover:bg-zinc-700 transition-colors"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveCartItem(idx)}
                              className="w-7 h-7 rounded bg-zinc-800 border border-zinc-700 hover:bg-[#D62828]/20 hover:border-[#D62828] text-zinc-400 hover:text-[#D62828] flex items-center justify-center transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Price section and actions */}
            <div>
              <div className="flex justify-between items-baseline mb-6 pt-2">
                <span className="font-sans text-xs text-zinc-400 font-medium font-mono">
                  {cart.length > 0 ? "TOTAL ESTIMATE:" : "ACTIVE PLATTER ESTIMATE:"}
                </span>
                <span className="font-mono text-3xl font-black text-[#D62828] tracking-tight">
                  ₦{(cart.length > 0 ? cartTotalPrice : currentPriceTotal).toLocaleString()}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (cart.length === 0) {
                    // Automatically add the active configured plate so they have an item
                    handleAddPlatterToCart();
                  }
                  handleCheckoutClick();
                }}
                className="w-full py-4 rounded-xl bg-white hover:bg-[#D62828] hover:text-white text-[#111111] font-mono text-xs uppercase tracking-wider font-bold transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg select-none cursor-pointer text-center"
              >
                <ShoppingBag className="w-4 h-4 text-[#FF7A00]" />
                Proceed to Checkout Form
              </button>

              <div className="mt-4 p-3 bg-zinc-900/60 rounded-xl text-[10px] text-zinc-400 leading-relaxed flex gap-2 border border-zinc-800">
                <span>🔥</span>
                <span>Each takeaway box is hand-packed at our signature woodfire stove using premium eco-friendly black thermal boxes.</span>
              </div>
            </div>

          </div>
          </div>

        </div>

      </div>
    </section>
  );
}
