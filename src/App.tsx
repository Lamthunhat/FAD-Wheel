/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  MapPin, 
  Coins, 
  HelpCircle, 
  Check, 
  CheckSquare, 
  Square,
  TrendingUp, 
  Flame, 
  UtensilsCrossed, 
  X,
  History,
  Info,
  Map as MapIcon,
  Send,
  MessageSquare
} from 'lucide-react';
import { WheelItem, WeatherInfo, AIRecommendation, Review, Branch } from './types';
import { 
  INITIAL_FOODS_AND_DRINKS, 
  HANOI_MERGED_WARDS, 
  getWeatherConditionLabel,
  getGoogleMapsSearchUrl,
  calculateDistanceInKm,
  getItemCoordinates,
  WARD_COORDINATES
} from './data';
import LuckyWheel from './components/LuckyWheel';
import GoogleMapsSearch from './components/GoogleMapsSearch';

const formatToHh = (timeStr?: string): string => {
  if (!timeStr) return '0h';
  if (timeStr.includes('h')) return timeStr;
  const match = timeStr.match(/^(\d+):/);
  if (match) {
    return `${parseInt(match[1])}h`;
  }
  return timeStr;
};

export default function App() {
  // 1. Data States
  const [customItems, setCustomItems] = useState<WheelItem[]>([]);
  const [items, setItems] = useState<WheelItem[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState<boolean>(true);

  useEffect(() => {
    const loadPlaces = async () => {
      try {
        const response = await fetch('/api/places');
        if (response.ok) {
          const data = await response.json() as WheelItem[];
          setItems(data);
          const customs = data.filter(it => it.id.startsWith('custom_') || it.id.startsWith('gmaps_') || it.id.startsWith('sa-'));
          setCustomItems(customs);
        } else {
          setItems(INITIAL_FOODS_AND_DRINKS);
          setCustomItems([]);
        }
      } catch (err) {
        console.error("Failed to fetch places from backend:", err);
        setItems(INITIAL_FOODS_AND_DRINKS);
        setCustomItems([]);
      } finally {
        setIsLoadingPlaces(false);
      }
    };
    loadPlaces();
  }, []);

  // Dynamically derive present categories in our database so users can filter by them
  const foodCategories = useMemo(() => {
    const list = items
      .filter(it => it.type === 'food' && it.category)
      .map(it => it.category!);
    const defaultPresets = ['Phở', 'Bún', 'Cơm', 'Món cuốn', 'Đồ Hàn', 'Đồ Nhật', 'Đồ ăn vặt', 'Lẩu', 'Bánh mì'];
    return Array.from(new Set([...defaultPresets, ...list])).filter(Boolean);
  }, [items]);

  const drinkCategories = useMemo(() => {
    const list = items
      .filter(it => it.type === 'drink' && it.category)
      .map(it => it.category!);
    const defaultPresets = ['Cà phê', 'Trà', 'Trà sữa', 'Sinh tố / Đá xay'];
    return Array.from(new Set([...defaultPresets, ...list])).filter(Boolean);
  }, [items]);

  const [weather, setWeather] = useState<WeatherInfo>({
    city: 'Hà Nội',
    temp: 26,
    condition: 'sunny',
    humidity: 62,
    windSpeed: 12,
    description: 'Trời thu nắng nhẹ dạo phố cổ Hà Nội cực kỳ thích thú.'
  });

  const [isWeatherLive, setIsWeatherLive] = useState<boolean>(false);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);

  // 2. Filter States
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'food' | 'drink'>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  
  // Reset subcategory when broad category changes
  useEffect(() => {
    setSelectedSubCategory('all');
  }, [selectedCategory]);

  const availableSubCategories = useMemo(() => {
    const relevantItems = items.filter(it => {
      if (selectedCategory === 'all') return true;
      return it.type === selectedCategory;
    });
    const cats = relevantItems
      .map(it => it.category)
      .filter((cat): cat is string => !!cat);
    return Array.from(new Set(cats)).sort((a: string, b: string) => a.localeCompare(b, 'vi'));
  }, [items, selectedCategory]);
  const [selectedWards, setSelectedWards] = useState<string[]>(() => {
    // Select all wards by default
    return HANOI_MERGED_WARDS;
  });
  const [onlyShowAIRecommended, setOnlyShowAIRecommended] = useState<boolean>(false);

  // 2b. Location and Saved Places Filter States
  const [savedListActiveType, setSavedListActiveType] = useState<'food' | 'drink'>('food');
  const [savedListWards, setSavedListWards] = useState<string[]>(() => HANOI_MERGED_WARDS);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [sortByDistance, setSortByDistance] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [savedListSubCat, setSavedListSubCat] = useState<string>('all');

  // 3. AI recommendation results
  const [aiResult, setAiResult] = useState<AIRecommendation | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Chatbot States
  const [chatMessages, setChatMessages] = useState<{
    id: string;
    sender: 'user' | 'bot';
    text: string;
    timestamp: string;
    recommendedItemIds?: string[];
  }[]>(() => {
    return [
      {
        id: 'welcome',
        sender: 'bot',
        text: 'Xin chào! Mình là Tú béo đây. 🍜 Hôm nay bạn muốn tìm quán ăn, đồ uống gì trong hòm quán tủ của mình nhỉ? Hãy nhắn tin hỏi mình nhé (ví dụ: "trời lạnh ăn phở tủ nào ngon" hay "Hôm nay trời nóng bức quá dắt người thương đi uống cafe đá ở đâu hợp?")',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  const chatEndRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Helper parser for basic markdown bold formatting and linebreaks from Gemini response
  const renderTextWithBolds = (text: string) => {
    if (!text) return "";
    const parts = text.split(/\n/);
    return parts.map((line, lineIdx) => {
      const boldParts = line.split(/\*\*/);
      return (
        <div key={lineIdx} className={lineIdx > 0 ? "mt-1.5" : ""}>
          {boldParts.map((part, partIdx) => {
            if (partIdx % 2 === 1) {
              return <strong key={partIdx} className="font-extrabold text-[#FFD166]">{part}</strong>;
            }
            return part;
          })}
        </div>
      );
    });
  };

  // 4. Spin States
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [winningItem, setWinningItem] = useState<WheelItem | null>(null);
  const [showWinModal, setShowWinModal] = useState<boolean>(false);
  const [spinHistory, setSpinHistory] = useState<{ item: WheelItem; timestamp: string }[]>(() => {
    const saved = localStorage.getItem('hanoi_spin_history');
    return saved ? JSON.parse(saved) : [];
  });

  // 5. Add custom item form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'food' | 'drink'>('food');
  const [newItemWard, setNewItemWard] = useState(HANOI_MERGED_WARDS[0]);
  const [newItemAddress, setNewItemAddress] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemWeather, setNewItemWeather] = useState<string[]>(['cool']);
  const [newItemCategory, setNewItemCategory] = useState('Phở');
  const [customNewItemCategory, setCustomNewItemCategory] = useState('');

  // 6. Detail with editing page view state
  const [selectedDetailItem, setSelectedDetailItem] = useState<WheelItem | null>(null);

  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<'food' | 'drink'>('food');
  const [editWard, setEditWard] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPrice, setEditPrice] = useState('20.000đ - 50.000đ');
  const [editBestWeather, setEditBestWeather] = useState<string[]>(['cool']);
  const [editCategory, setEditCategory] = useState('');
  const [customEditCategory, setCustomEditCategory] = useState('');

  // Reviews specific states
  const [editReviews, setEditReviews] = useState<Review[]>([]);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [reviewPrice, setReviewPrice] = useState<'rẻ' | 'vừa' | 'đắt'>('vừa');
  const [reviewQuantity, setReviewQuantity] = useState<'ít' | 'no' | 'nhiều'>('no');
  const [reviewHygiene, setReviewHygiene] = useState<'sạch sẽ' | 'bẩn'>('sạch sẽ');
  const [reviewSpace, setReviewSpace] = useState<'rộng rãi - thoáng mát' | 'chật chội - nóng nực'>('rộng rãi - thoáng mát');
  const [reviewParking, setReviewParking] = useState<'có' | 'không'>('có');


  // Branches specific states
  const [editBranches, setEditBranches] = useState<Branch[]>([]);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');

  useEffect(() => {
    if (selectedDetailItem) {
      setEditName(selectedDetailItem.name);
      setEditType(selectedDetailItem.type);
      setEditWard(selectedDetailItem.location.ward);
      setEditAddress(selectedDetailItem.location.addressDetail || '');
      setEditPrice(selectedDetailItem.priceRange);
      setEditBestWeather(selectedDetailItem.bestWeather || ['cool']);
      setEditReviews(selectedDetailItem.reviews || []);
      setEditBranches(selectedDetailItem.branches || []);
      
      const itemCat = selectedDetailItem.category || '';
      const listToCheck = selectedDetailItem.type === 'food' ? foodCategories : drinkCategories;
      if (itemCat && !listToCheck.includes(itemCat)) {
        setEditCategory('custom_other');
        setCustomEditCategory(itemCat);
      } else {
        setEditCategory(itemCat);
        setCustomEditCategory('');
      }
    }
  }, [selectedDetailItem]);

  // Syncing is now handled via MongoDB Atlas backend database API routes.

  // Sync spin history to localStorage
  useEffect(() => {
    localStorage.setItem('hanoi_spin_history', JSON.stringify(spinHistory));
  }, [spinHistory]);

  // Dynamic derivation of matching saved list items based on advanced filters
  const filteredSavedItems = useMemo(() => {
    return customItems.filter(item => {
      // 1. Broad Type Filter (food or drink)
      if (item.type !== savedListActiveType) {
        return false;
      }

      // 2. Subcategory Filter ("Danh mục món/nước")
      if (savedListSubCat !== 'all' && item.category !== savedListSubCat) {
        return false;
      }

      // 3. Ward Filter (Matching main location OR any of its branches)
      // "nếu các quán có nhiều cơ sở thì bộ lọc phường sẽ lọc được quán ở phường đó."
      const mainWardMatches = savedListWards.includes(item.location.ward);
      
      let branchWardMatches = false;
      if (item.branches && item.branches.length > 0) {
        for (const br of item.branches) {
          const addrLower = br.address.toLowerCase();
          for (const ward of savedListWards) {
            if (addrLower.includes(ward.toLowerCase())) {
              branchWardMatches = true;
              break;
            }
            const wardShort = ward.replace(/^Phường\s+/i, '').trim().toLowerCase();
            if (wardShort && addrLower.includes(wardShort)) {
              branchWardMatches = true;
              break;
            }
          }
          if (branchWardMatches) break;
        }
      }

      if (!mainWardMatches && !branchWardMatches) {
        return false;
      }

      return true;
    });
  }, [customItems, savedListActiveType, savedListSubCat, savedListWards]);

  // Sorting saved items by nearest distance if enabled, otherwise alphabetically
  const processedSavedItems = useMemo(() => {
    const list = [...filteredSavedItems];

    if (sortByDistance && userCoords) {
      // Helper to compute min distance to user position (primary or branch coords)
      const listWithDistance = list.map(item => {
        const primaryCoords = getItemCoordinates(item);
        let minDistance = calculateDistanceInKm(userCoords.lat, userCoords.lng, primaryCoords.lat, primaryCoords.lng);
        
        if (item.branches && item.branches.length > 0) {
          for (const br of item.branches) {
            // Check address to map to a ward's geographical center
            let matchedCoords: { lat: number; lng: number } | null = null;
            for (const ward of HANOI_MERGED_WARDS) {
              if (br.address.toLowerCase().includes(ward.toLowerCase())) {
                matchedCoords = WARD_COORDINATES[ward];
                break;
              }
              const wardShort = ward.replace(/^Phường\s+/i, '').trim().toLowerCase();
              if (wardShort && br.address.toLowerCase().includes(wardShort)) {
                matchedCoords = WARD_COORDINATES[ward];
                break;
              }
            }
            if (matchedCoords) {
              const brDist = calculateDistanceInKm(userCoords.lat, userCoords.lng, matchedCoords.lat, matchedCoords.lng);
              if (brDist < minDistance) {
                minDistance = brDist;
              }
            }
          }
        }
        return { item, distance: minDistance };
      });

      // Sort by distance ascending
      return listWithDistance
        .sort((a, b) => a.distance - b.distance)
        .map(obj => ({
          ...obj.item,
          calculatedDistance: obj.distance
        }));
    } else {
      // Sort alphabetically
      return list.sort((a, b) => a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' }));
    }
  }, [filteredSavedItems, sortByDistance, userCoords]);

  // HANOI_MERGED_WARDS doesn't require a district-ward sync secondary effect anymore.

  // Load real-time live weather on mount
  useEffect(() => {
    fetchLiveWeather();
  }, []);

  const fetchLiveWeather = async () => {
    setIsWeatherLoading(true);
    try {
      const res = await fetch('/api/weather/hanoi-live');
      if (res.ok) {
        const data = await res.json();
        setWeather(data);
        setIsWeatherLive(true);
      }
    } catch (e) {
      console.error('Error fetching live weather', e);
    } finally {
      setIsWeatherLoading(false);
    }
  };

  // Trigger Gemini AI advisor recommendation with local caching to prevent rate-limiting (429)
  const handleTriggerAI = async () => {
    if (!weather) return;

    // Build a unique cache key based on weather condition, temperature, and current items count
    const cacheKey = `hanoi_ai_rec_${weather.condition}_${Math.round(weather.temp || 26)}_${items.length}`;
    const cachedRecommend = localStorage.getItem(cacheKey);

    if (cachedRecommend) {
      try {
        const parsed = JSON.parse(cachedRecommend);
        if (parsed && parsed.suggestedItems && parsed.weatherAnalysis) {
          setAiResult(parsed);
          return;
        }
      } catch (err) {
        localStorage.removeItem(cacheKey);
      }
    }

    setIsAiLoading(true);
    try {
      const response = await fetch('/api/weather/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weather: weather,
          items: items
        })
      });
      if (response.ok) {
        const data = await response.json();
        setAiResult(data);
        
        // Cache the valid response
        if (data && data.suggestedItems) {
          localStorage.setItem(cacheKey, JSON.stringify(data));
        }
      }
    } catch (e) {
      console.error('Error getting AI recommendation', e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Handle Interactive Chatbot submission
  const handleSendChatMessage = async () => {
    const userMsgText = chatInput.trim();
    if (!userMsgText) return;

    const userMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user' as const,
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    // Update messages with user's input immediately
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setChatInput('');
    setIsChatLoading(true);

    // Context message history slice (limit to avoid token explosion)
    const historyPayload = updatedMessages.slice(-8).map(msg => ({
      sender: msg.sender,
      text: msg.text
    }));

    try {
      const response = await fetch('/api/advisor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMsgText,
          history: historyPayload,
          items: items // saved custom & preset items combined
        })
      });

      if (response.ok) {
        const data = await response.json();
        const botMessage = {
          id: `msg_${Date.now()}_bot`,
          sender: 'bot' as const,
          text: data.reply || "Gợi ý của mình đã sẵn sàng cho bạn thưởng thức rồi đấy!",
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          recommendedItemIds: data.recommendedItemIds
        };
        setChatMessages(prev => [...prev, botMessage]);

        // Integrate with the main app recommendation filter:
        // By updating aiResult, the "Chỉ hiện gợi ý AI" flag on items will automatically filter lists
        if (data.recommendedItemIds && data.recommendedItemIds.length > 0) {
          setAiResult({
            suggestedItems: data.recommendedItemIds,
            weatherAnalysis: data.reply,
            vibeText: "Hà Nội ngõ nhỏ, phố nhỏ, quán nhỏ lấp lánh niềm vui ngọt ngào."
          });
        }
      } else {
        throw new Error("Server error responding to advisor chat");
      }
    } catch (error) {
      console.warn("Chatbot fetch error:", error);
      const botErrorMessage = {
        id: `msg_${Date.now()}_err`,
        sender: 'bot' as const,
        text: "Ôi hổ thẹn quá, đầu máy AI của mình bận rộn mất rồi! Mình đã chuyển kết nối ngoại tuyến. Thử hỏi các câu liên quan đến **nóng/lạnh/phở/bún chả** để mình tra cứu nhanh danh mục offline cho bạn liền nha!",
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, botErrorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Run AI upon first weather update if Gemini API is available
  useEffect(() => {
    if (weather) {
      handleTriggerAI();
    }
  }, [weather.condition, weather.temp]);

  // Filter items for the spinner wheel
  const filteredItems = items.filter(item => {
    // 1. Category Filter
    if (selectedCategory !== 'all' && item.type !== selectedCategory) {
      return false;
    }
    // 1b. Sub Category Filter (Danh mục cụ thể)
    if (selectedSubCategory !== 'all' && item.category !== selectedSubCategory) {
      return false;
    }
    // 2. Ward Filter
    if (!selectedWards.includes(item.location.ward)) {
      return false;
    }
    return true;
  });

  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    let finalCategory = newItemCategory === 'custom_other'
      ? (customNewItemCategory.trim() || 'Khác')
      : newItemCategory;

    if (newItemCategory === 'custom_other') {
      finalCategory = finalCategory
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }

    const added: WheelItem = {
      id: 'custom_' + Date.now(),
      name: newItemName.trim(),
      type: newItemType,
      category: finalCategory,
      location: {
        ward: newItemWard,
        addressDetail: newItemAddress.trim() || undefined
      },
      priceRange: newItemPrice,
      bestWeather: newItemWeather,
      reviews: []
    };

    try {
      const response = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(added)
      });
      if (response.ok) {
        const saved = await response.json();
        setCustomItems(prev => [saved, ...prev]);
        setItems(prev => [saved, ...prev]);
      } else {
        setCustomItems(prev => [added, ...prev]);
        setItems(prev => [added, ...prev]);
      }
    } catch (err) {
      console.error("Error creating place on server:", err);
      setCustomItems(prev => [added, ...prev]);
      setItems(prev => [added, ...prev]);
    }

    if (!selectedWards.includes(newItemWard)) {
      setSelectedWards(prev => [...prev, newItemWard]);
    }

    // Reset fields
    setNewItemName('');
    setNewItemAddress('');
    setCustomNewItemCategory('');
    
    // Add success toast
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-[#06D6A0] text-[#2D3047] border-4 border-[#2D3047] px-4 py-2 rounded-xl font-bold font-mono text-sm shadow-[4px_4px_0px_#2D3047] z-50 animate-float';
    toast.innerText = `Đã thêm món "${added.name}" thành công!`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Bạn có chắc chắn muốn xóa địa điểm này khỏi thực đơn không?')) {
      try {
        const response = await fetch(`/api/places/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setItems(prev => prev.filter(item => item.id !== id));
          setCustomItems(prev => prev.filter(item => item.id !== id));
        } else {
          setItems(prev => prev.filter(item => item.id !== id));
          setCustomItems(prev => prev.filter(item => item.id !== id));
        }
      } catch (err) {
        console.error("Error deleting place from server:", err);
        setItems(prev => prev.filter(item => item.id !== id));
        setCustomItems(prev => prev.filter(item => item.id !== id));
      }
    }
  };

  const handleSaveEditedItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDetailItem) return;
    if (!editName.trim()) return;

    let finalCat = editCategory === 'custom_other'
      ? (customEditCategory.trim() || 'Khác')
      : editCategory;

    if (editCategory === 'custom_other') {
      finalCat = finalCat
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }

    const updatedItem: WheelItem = {
      ...selectedDetailItem,
      name: editName.trim(),
      type: editType,
      category: finalCat,
      location: {
        ward: editWard,
        addressDetail: editAddress.trim() || undefined
      },
      priceRange: editPrice.trim(),
      bestWeather: editBestWeather,
      reviews: editReviews,
      branches: editBranches
    };

    try {
      const response = await fetch(`/api/places/${updatedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem)
      });
      if (response.ok) {
        const saved = await response.json();
        setItems(prev => prev.map(item => item.id === saved.id ? saved : item));
        setCustomItems(prev => prev.map(item => item.id === saved.id ? saved : item));
      } else {
        setItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
        setCustomItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
      }
    } catch (err) {
      console.error("Error updating place on server:", err);
      setItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
      setCustomItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    }

    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-[#06D6A0] text-[#2D3047] border-4 border-[#2D3047] px-4 py-2 rounded-xl font-bold font-mono text-sm shadow-[4px_4px_0px_#2D3047] z-50 animate-float';
    toast.innerText = `Đã cập nhật món "${updatedItem.name}" thành công!`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);

    setCustomEditCategory('');
    setSelectedDetailItem(null);
  };

  const handleImportItem = async (imported: WheelItem) => {
    const itemToImport = {
      ...imported,
      reviews: imported.reviews || [],
      branches: imported.branches || []
    };

    try {
      const response = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemToImport)
      });
      if (response.ok) {
        const saved = await response.json();
        setItems(prev => {
          if (prev.some(it => it.id === saved.id)) return prev;
          return [saved, ...prev];
        });
        setCustomItems(prev => {
          if (prev.some(it => it.id === saved.id)) return prev;
          return [saved, ...prev];
        });
      } else {
        setItems(prev => {
          if (prev.some(it => it.id === itemToImport.id)) return prev;
          return [itemToImport, ...prev];
        });
        setCustomItems(prev => {
          if (prev.some(it => it.id === itemToImport.id)) return prev;
          return [itemToImport, ...prev];
        });
      }
    } catch (err) {
      console.error("Error importing place to server:", err);
      setItems(prev => {
        if (prev.some(it => it.id === itemToImport.id)) return prev;
        return [itemToImport, ...prev];
      });
      setCustomItems(prev => {
        if (prev.some(it => it.id === itemToImport.id)) return prev;
        return [itemToImport, ...prev];
      });
    }

    if (!selectedWards.includes(imported.location.ward)) {
      setSelectedWards(prev => [...prev, imported.location.ward]);
    }
  };

  const handleRemoveImportedItem = async (id: string) => {
    try {
      const response = await fetch(`/api/places/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setItems(prev => prev.filter(item => item.id !== id));
        setCustomItems(prev => prev.filter(item => item.id !== id));
      } else {
        setItems(prev => prev.filter(item => item.id !== id));
        setCustomItems(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error("Error removing imported place from server:", err);
      setItems(prev => prev.filter(item => item.id !== id));
      setCustomItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleResetDefaults = async () => {
    if (confirm('Bạn muốn khôi phục danh sách món ăn gốc từ LAMBOM WHEEL chứ? Các quán bạn từng tự thêm vẫn sẽ được giữ lại vĩnh viễn.')) {
      try {
        for (const preset of INITIAL_FOODS_AND_DRINKS) {
          await fetch(`/api/places/${preset.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(preset)
          });
        }
        
        const response = await fetch('/api/places');
        if (response.ok) {
          const data = await response.json() as WheelItem[];
          setItems(data);
          const customs = data.filter(it => it.id.startsWith('custom_') || it.id.startsWith('gmaps_') || it.id.startsWith('sa-'));
          setCustomItems(customs);
        }
      } catch (err) {
        console.error("Error resetting defaults:", err);
      }
      setSelectedWards(HANOI_MERGED_WARDS);
      setOnlyShowAIRecommended(false);
    }
  };

  const handleSpinEnd = (item: WheelItem) => {
    setWinningItem(item);
    setShowWinModal(true);

    // Save history
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setSpinHistory(prev => [{ item, timestamp: formattedTime }, ...prev.slice(0, 19)]);
  };

  const toggleWard = (ward: string) => {
    setSelectedWards(prev => {
      if (prev.includes(ward)) {
        // Prevent deselecting everything so wheel doesn't collapse entirely
        if (prev.length <= 1) return prev;
        return prev.filter(w => w !== ward);
      } else {
        return [...prev, ward];
      }
    });
  };

  const toggleSavedListWard = (ward: string) => {
    setSavedListWards(prev => {
      if (prev.includes(ward)) {
        if (prev.length <= 1) return prev;
        return prev.filter(w => w !== ward);
      } else {
        return [...prev, ward];
      }
    });
  };

  const handleSetMockLocation = () => {
    setUserCoords({ lat: 21.0285, lng: 105.8521 });
    setSortByDistance(true);
    
    const toast = document.createElement('div');
    toast.className = "fixed bottom-5 right-5 bg-[#118AB2] text-white font-black text-xs px-4 py-3 rounded-xl border-2 border-stone-800 shadow-[3px_3px_0px_#2D3047] z-50 transition-all";
    toast.innerText = "📍 Đã đặt mốc vị trí tại Hồ Hoàn Kiếm, Hà Nội!";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt không hỗ trợ Geolocation.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLocating(false);
        setSortByDistance(true);
        
        const toast = document.createElement('div');
        toast.className = "fixed bottom-5 right-5 bg-[#06D6A0] text-white font-black text-xs px-4 py-3 rounded-xl border-2 border-stone-850 shadow-[3px_3px_0px_#2D3047] z-50 transition-all";
        toast.innerText = "✨ Định vị thành công vị trí của bạn!";
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
      },
      (error) => {
        console.warn("Geolocation error:", error);
        setIsLocating(false);
        
        let errorMsg = "Không thể lấy vị trí GPS.";
        if (error.code === 1) {
          errorMsg = "Quyền truy cập vị trí bị từ chối! Vui lòng cho phép định vị trong cài đặt Safari/iOS (Cài đặt -> Quyền riêng tư -> Dịch vụ định vị -> Safari) hoặc bật định vị của điện thoại.";
        } else if (error.code === 2) {
          errorMsg = "Không tìm thấy dữ liệu GPS (Vị trí không khả dụng). Hãy thử lại ở nơi thoáng mát hoặc bật mạng.";
        } else if (error.code === 3) {
          errorMsg = "Yêu cầu định vị bị hết thời gian (Timeout).";
        }
        
        alert(`❌ Định vị thất bại:\n${errorMsg}\n\nHệ thống sẽ tự động đặt mốc mặc định tại Hồ Hoàn Kiếm, Hà Nội.`);
        
        // Fallback: Hồ Gươm Hoàn Kiếm centroid
        setUserCoords({ lat: 21.0285, lng: 105.8521 });
        setSortByDistance(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0
      }
    );
  };


  const toggleAllWardsInDistrict = (wards: string[]) => {
    const hasAll = wards.every(w => selectedWards.includes(w));
    if (hasAll) {
      // Remove these 
      const remaining = selectedWards.filter(w => !wards.includes(w));
      setSelectedWards(remaining.length > 0 ? remaining : [wards[0]]);
    } else {
      // Add all
      const toAdd = wards.filter(w => !selectedWards.includes(w));
      setSelectedWards(prev => [...prev, ...toAdd]);
    }
  };

  return (
    <div id="hanoi-foodie-root" className="min-h-screen bg-[#FFF9F2] vintage-grid flex flex-col font-sans select-none relative pb-12">
      
      {/* Header Bar */}
      <header id="hanoi-header" className="bg-white border-b-4 border-[#FF6B35] flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 md:px-8 md:py-4 shrink-0 gap-3 md:gap-4 mb-6 shadow-xs">
        <div className="flex flex-col w-full sm:w-auto text-left gap-1">
          {/* Hàng 1: Icon Dao Nĩa + Tiêu đề LAMBOM WHEEL */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 md:w-11 md:h-11 bg-[#FF6B35] rounded-xl flex items-center justify-center border-2 border-[#2D3047] shadow-[2px_2px_0px_#2D3047] md:shadow-[3px_3px_0px_#2D3047] shrink-0">
              <UtensilsCrossed className="w-5 h-5 md:w-6.5 md:h-6.5 text-white" />
            </div>
            <h1 className="text-xl md:text-2xl font-black text-[#2D3047] uppercase tracking-tight leading-none">
              LAMBOM WHEEL
            </h1>
          </div>
          
          {/* Hàng 2: Vòng quay chọn món cho người OVTK */}
          <p className="text-[9.5px] md:text-xs font-bold text-[#FF6B35] uppercase tracking-widest flex items-center gap-1 leading-none mt-1 pl-0.5">
            <Sparkles className="w-3.5 h-3.5 fill-[#FF6B35]/20 animate-pulse shrink-0" />
            Vòng quay chọn món cho người OVTK
          </p>
        </div>

        {/* Header Live Weather Display Badge */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end mt-1 sm:mt-0">
          <div className="bg-[#E1F2FE] border-2 border-[#118AB2] rounded-full px-4 py-1.5 md:px-5 md:py-2 flex items-center gap-2.5 md:gap-3 shadow-[2.5px_2.5px_0px_#118AB2] md:shadow-[3px_3px_0px_#118AB2]">
            <span className="text-xl md:text-2xl animate-bounce">
              {weather.condition === 'hot' && '🔥'}
              {weather.condition === 'sunny' && '☀️'}
              {weather.condition === 'cold' && '❄️'}
              {weather.condition === 'rainy' && '🌧️'}
              {weather.condition === 'cool' && '🍃'}
              {weather.condition === 'windy' && '💨'}
              {weather.condition === 'humid' && '🌫️'}
            </span>
            <div className="text-left">
              <p className="text-[8.5px] md:text-[10px] font-bold text-[#118AB2] uppercase tracking-wider leading-none mb-0.5">Thời tiết hiện tại</p>
              <p className="text-xs md:text-sm font-black text-[#2D3047] leading-tight">
                {weather.temp}°C • {getWeatherConditionLabel(weather.condition)}
              </p>
            </div>
          </div>
          
          <button
            id="btn-re-sync-weather"
            title="Đồng bộ lại thời tiết"
            onClick={fetchLiveWeather}
            className="p-2 md:p-2.5 bg-white border-2 border-[#2D3047] hover:bg-[#FFF9F2] rounded-full shadow-[2px_2px_0px_#2D3047] cursor-pointer shrink-0"
          >
            <History className={`w-3.5 h-3.5 md:w-4 md:h-4 text-[#2D3047] ${isWeatherLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>



      {/* Main Grid container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {selectedDetailItem ? (
          <div id="full-detail-edit-container" className="col-span-12 bg-white border-4 border-[#2D3047] rounded-[36px] p-6 md:p-8 shadow-[8px_8px_0px_#2D3047] relative">
            {/* Header of Detail Page */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b-4 border-[#2D3047] pb-5 mb-6 gap-4 font-sans">
              <div>
                <button
                  id="btn-back-to-home"
                  type="button"
                  onClick={() => setSelectedDetailItem(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-[#FF6B35] hover:underline mb-2 cursor-pointer uppercase tracking-tight"
                >
                  ← Quay lại Vòng Quay & Thực Đơn
                </button>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`${editType === 'food' ? 'bg-[#EF476F]' : 'bg-[#118AB2]'} text-white text-[10px] font-black px-2.5 py-1 rounded-md border-2 border-[#2D3047] uppercase inline-block shadow-[1.5px_1.5px_0px_#2D3047]`}>
                    {editType === 'food' ? '🍱 Địa điểm Ăn uống' : '☕ Quán Cà phê / Đồ uống'}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-[#2D3047] leading-tight font-serif">
                  {editName || selectedDetailItem.name}
                </h2>
                <p className="text-xs text-stone-500 font-mono mt-1">Sổ tay quán tủ cá nhân (local)</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-cancel-edit-top"
                  type="button"
                  onClick={() => setSelectedDetailItem(null)}
                  className="bg-white hover:bg-stone-50 text-[#2D3047] font-black px-4 py-2.5 rounded-xl uppercase text-xs border-4 border-[#2D3047] shadow-[3px_3px_0px_#2D3047] transition-all cursor-pointer text-center"
                >
                  Hủy bỏ
                </button>
                <button
                  id="btn-submit-edit-top"
                  form="edit-detail-food-form"
                  type="submit"
                  className="bg-[#06D6A0] hover:bg-[#12dda7] text-[#2D3047] font-black px-5 py-2.5 rounded-xl uppercase text-xs border-4 border-[#2D3047] shadow-[3px_3px_0px_#2D3047] transition-all cursor-pointer text-center font-sans font-bold"
                >
                  💾 Lưu thay đổi
                </button>
              </div>
            </div>

            {/* Content Grid */}
            <form id="edit-detail-food-form" onSubmit={handleSaveEditedItem} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left side: Information fields */}
              <div className="lg:col-span-12 xl:col-span-8 space-y-6">
                <div className="bg-[#FAF8F5] border-2 border-[#2D3047] rounded-3xl p-5 md:p-6 shadow-[4px_4px_0px_#2D3047]">
                  <h3 className="text-xs font-black text-[#2D3047] uppercase tracking-wider mb-4 border-b border-stone-200 pb-2 font-bold">
                    ✏️ THÔNG TIN TỔNG QUAN
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">
                        Tên Quán Tủ / Tên món *
                      </label>
                      <input
                        id="edit-item-name"
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full text-xs font-bold border-2 border-[#2D3047] rounded-xl px-3 py-2.5 bg-white focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">
                        Phân Loại Địa Điểm *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          id="edit-type-food"
                          type="button"
                          onClick={() => {
                            setEditType('food');
                            setEditCategory('Phở');
                            setCustomEditCategory('');
                          }}
                          className={`py-2 px-3 rounded-xl font-black text-xs uppercase border-2 border-[#2D3047] transition-all cursor-pointer text-center ${
                            editType === 'food'
                              ? 'bg-[#EF476F] text-white shadow-[2px_2px_0px_#2D3047]'
                              : 'bg-white text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          🍱 Đồ ăn
                        </button>
                        <button
                          id="edit-type-drink"
                          type="button"
                          onClick={() => {
                            setEditType('drink');
                            setEditCategory('Cà phê');
                            setCustomEditCategory('');
                          }}
                          className={`py-2 px-3 rounded-xl font-black text-xs uppercase border-2 border-[#2D3047] transition-all cursor-pointer text-center ${
                            editType === 'drink'
                              ? 'bg-[#118AB2] text-white shadow-[2px_2px_0px_#2D3047]'
                              : 'bg-white text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          🥤 Cà phê/Đồ uống
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">
                        Danh Mục Chi Tiết
                      </label>
                      <select
                        id="edit-item-category-select"
                        value={editCategory === 'custom_other' ? 'custom_other' : (([...foodCategories, ...drinkCategories].includes(editCategory)) ? editCategory : 'custom_other')}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditCategory(val);
                          if (val !== 'custom_other') {
                            setCustomEditCategory('');
                          }
                        }}
                        className="w-full text-xs font-semibold border-2 border-[#2D3047] rounded-xl px-3 py-2.5 bg-white focus:outline-hidden"
                      >
                        {(editType === 'food' ? foodCategories : drinkCategories).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="custom_other">✍️ Nhập danh mục mới...</option>
                      </select>
                    </div>

                    {(editCategory === 'custom_other' || (![...foodCategories, ...drinkCategories].includes(editCategory) && editCategory !== '')) && (
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-black text-[#EF476F] uppercase tracking-widest block mb-1 font-extrabold animate-pulse">
                          ✏️ Tên danh mục tùy chọn mới *
                        </label>
                        <input
                          id="edit-item-custom-category"
                          type="text"
                          required
                          placeholder="Ví dụ: Đồ Hàn, Món cuốn, Trà hoa..."
                          value={editCategory === 'custom_other' ? customEditCategory : editCategory}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (editCategory === 'custom_other') {
                              setCustomEditCategory(val);
                            } else {
                              setEditCategory(val);
                            }
                          }}
                          className="w-full text-xs font-bold border-2 border-[#EF476F] rounded-xl px-3 py-2.5 bg-white focus:outline-hidden placeholder-stone-400"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-black text-[#2D3047] uppercase tracking-widest block mb-1 font-bold">
                        Phường Sát Nhập Cố Định *
                      </label>
                      <select
                        id="edit-item-ward"
                        value={editWard}
                        onChange={(e) => setEditWard(e.target.value)}
                        className="w-full text-xs font-semibold border-2 border-[#2D3047] rounded-xl px-3 py-2.5 bg-white focus:outline-hidden"
                      >
                        {HANOI_MERGED_WARDS.map(ward => (
                          <option key={ward} value={ward}>{ward}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">
                        Địa Chỉ Cụ Thể (Số nhà, ngõ ngách)
                      </label>
                      <input
                        id="edit-item-address"
                        type="text"
                        placeholder="Ví dụ: Số 25 Hàng Khay"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        className="w-full text-xs font-semibold border-2 border-[#2D3047] rounded-xl px-3 py-2.5 bg-white focus:outline-hidden"
                      />
                    </div>


                    {/* Danh sách các chi nhánh/cơ sở */}
                    <div className="bg-[#FAF8F5] border-2 border-[#2D3047] rounded-3xl p-5 md:p-6 shadow-[4px_4px_0px_#2D3047] md:col-span-2">
                      <h3 className="text-xs font-black text-[#2D3047] uppercase tracking-wider mb-4 border-b border-stone-200 pb-2 font-bold flex items-center justify-between">
                        <span>🏢 CÁC CƠ SỞ / CHI NHÁNH ({editBranches.length})</span>
                      </h3>

                      {/* Form thêm cơ sở mới */}
                      <div className="bg-white border-2 border-[#2D3047] rounded-2xl p-4 mb-5 shadow-[2px_2px_0px_#2D3047] space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">
                              Tên Cơ Sở *
                            </label>
                            <input
                              id="input-new-branch-name"
                              type="text"
                              placeholder="Ví dụ: Cơ sở Tây Hồ, Cơ sở 2"
                              value={newBranchName}
                              onChange={(e) => setNewBranchName(e.target.value)}
                              className="w-full text-xs font-semibold border-2 border-[#2D3047] rounded-xl px-3 py-2 bg-[#FAF8F5] focus:bg-white focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">
                              Địa Chỉ Cơ Sở *
                            </label>
                            <input
                              id="input-new-branch-address"
                              type="text"
                              placeholder="Ví dụ: Số 12 Hàng Bè, Hoàn Kiếm, Hà Nội"
                              value={newBranchAddress}
                              onChange={(e) => setNewBranchAddress(e.target.value)}
                              className="w-full text-xs font-semibold border-2 border-[#2D3047] rounded-xl px-3 py-2 bg-[#FAF8F5] focus:bg-white focus:outline-hidden"
                            />
                          </div>
                        </div>

                        <button
                          id="btn-add-branch-action"
                          type="button"
                          onClick={() => {
                            if (!newBranchName.trim() || !newBranchAddress.trim()) return;
                            const branchToAdd: Branch = {
                              id: 'br_' + Date.now(),
                              name: newBranchName.trim(),
                              address: newBranchAddress.trim()
                            };
                            setEditBranches(prev => [...prev, branchToAdd]);
                            setNewBranchName('');
                            setNewBranchAddress('');
                          }}
                          className="inline-flex items-center gap-1 bg-[#2D3047] hover:bg-stone-800 text-white font-bold p-2 px-4 rounded-xl text-[10px] uppercase cursor-pointer tracking-wider active:translate-y-0.5 select-none"
                        >
                          ➕ Thêm Cơ Sở
                        </button>
                      </div>

                      {/* Danh sách cơ sở hiện hữu */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-1">
                        {editBranches.length > 0 ? (
                          editBranches.map((br) => (
                            <div
                              key={br.id}
                              className="bg-[#FAF8F5] border-2 border-[#2D3047] rounded-2xl p-3 shadow-[2.5px_2.5px_0px_#2D3047] hover:bg-white hover:shadow-[4px_4px_0px_#2D3047] transition-all duration-150 flex flex-col gap-1.5 justify-between text-left"
                            >
                              <div className="flex items-start justify-between gap-2 border-b border-dashed border-stone-200 pb-1">
                                <span className="text-xs font-black text-[#2D3047]">{br.name}</span>
                                <button
                                  type="button"
                                  onClick={() => setEditBranches(prev => prev.filter(b => b.id !== br.id))}
                                  className="text-red-500 hover:text-red-700 font-bold hover:scale-110 cursor-pointer p-0.5 rounded transition-all text-xs"
                                  title="Xóa cơ sở này"
                                >
                                  🗑️
                                </button>
                              </div>
                              <p className="text-[11px] text-stone-600 font-bold leading-normal">📍 {br.address}</p>
                              
                              <div className="flex justify-end pt-1">
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${editName} ${br.address}`)}`}
                                  target="_blank"
                                  referrerPolicy="no-referrer"
                                  className="text-[9px] font-black text-[#118AB2] hover:underline"
                                >
                                  🗺️ Chỉ đường
                                </a>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 text-center py-6 border-2 border-dashed border-stone-200 rounded-2xl bg-white">
                            <p className="text-xs text-stone-400 italic font-medium">Chưa có chi nhánh cơ sở phụ nào được khai báo.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-[#FAF8F5] border-2 border-[#2D3047] rounded-3xl p-5 md:p-6 shadow-[4px_4px_0px_#2D3047] md:col-span-2">
                      <h3 className="text-xs font-black text-[#2D3047] uppercase tracking-wider mb-4 border-b border-stone-200 pb-2 font-bold flex items-center justify-between">
                        <span>⭐ ĐÁNH GIÁ CHẤT LƯỢNG QUÁN ({editReviews.length})</span>
                      </h3>

                      {/* Form viết đánh giá mới */}
                      <div className="bg-white border-2 border-[#2D3047] rounded-2xl p-4 mb-5 shadow-[2px_2px_0px_#2D3047] space-y-3">
                        <div>
                          <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">
                            Điểm Đánh Giá (Xếp hạng sao)
                          </label>
                          <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setNewReviewRating(s)}
                                className="text-2xl transition-all cursor-pointer hover:scale-110 active:scale-90 p-0.5"
                              >
                                {s <= newReviewRating ? '⭐' : '☆'}
                              </button>
                            ))}
                            <span className="text-xs font-black text-[#FF6B35] ml-2 font-mono">{newReviewRating}/5 Sao</span>
                          </div>
                        </div>

                        {/* Chọn nhanh tiêu chí trải nghiệm */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 bg-stone-50 border border-stone-200 p-3 rounded-2xl text-[11px] select-none text-left">
                          {/* Nhóm 1: Giá thành */}
                          <div className="space-y-1">
                            <span className="font-bold text-stone-600 block">💰 Giá thành:</span>
                            <div className="flex gap-1">
                              {['rẻ', 'vừa', 'đắt'].map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setReviewPrice(val as any)}
                                  className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase cursor-pointer transition-all ${
                                    reviewPrice === val
                                      ? 'bg-[#EF476F] text-white border-[#EF476F] shadow-[1px_1px_0px_#2D3047]'
                                      : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-100'
                                  }`}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Nhóm 2: Định lượng/Chất lượng suất ăn */}
                          <div className="space-y-1">
                            <span className="font-bold text-stone-600 block">🍽️ Định lượng:</span>
                            <div className="flex gap-1">
                              {['ít', 'no', 'nhiều'].map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setReviewQuantity(val as any)}
                                  className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase cursor-pointer transition-all ${
                                    reviewQuantity === val
                                      ? 'bg-[#118AB2] text-white border-[#118AB2] shadow-[1px_1px_0px_#2D3047]'
                                      : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-100'
                                  }`}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Nhóm 3: Vệ sinh */}
                          <div className="space-y-1">
                            <span className="font-bold text-stone-600 block">✨ Vệ sinh:</span>
                            <div className="flex gap-1">
                              {['sạch sẽ', 'bẩn'].map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setReviewHygiene(val as any)}
                                  className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase cursor-pointer transition-all ${
                                    reviewHygiene === val
                                      ? 'bg-[#06D6A0] text-[#2D3047] border-[#06D6A0] shadow-[1px_1px_0px_#2D3047]'
                                      : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-100'
                                  }`}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Nhóm 4: Không gian */}
                          <div className="space-y-1">
                            <span className="font-bold text-stone-600 block">🏡 Không gian:</span>
                            <div className="flex gap-1">
                              {['rộng rãi - thoáng mát', 'chật chội - nóng nực'].map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setReviewSpace(val as any)}
                                  className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase cursor-pointer transition-all ${
                                    reviewSpace === val
                                      ? 'bg-[#FF6B35] text-white border-[#FF6B35] shadow-[1px_1px_0px_#2D3047]'
                                      : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-100'
                                  }`}
                                >
                                  {val === 'rộng rãi - thoáng mát' ? 'rộng' : 'chật'}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Nhóm 5: Chỗ để xe */}
                          <div className="space-y-1">
                            <span className="font-bold text-stone-600 block">🏍️ Chỗ để xe:</span>
                            <div className="flex gap-1">
                              {['có', 'không'].map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setReviewParking(val as any)}
                                  className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase cursor-pointer transition-all ${
                                    reviewParking === val
                                      ? 'bg-[#2D3047] text-white border-[#2D3047] shadow-[1px_1px_0px_#2D3047]'
                                      : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-100'
                                  }`}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">
                            Bình Luận / Trải Nghiệm Thực Tế *
                          </label>
                          <textarea
                            id="form-review-comment"
                            rows={2}
                            value={newReviewComment}
                            onChange={(e) => setNewReviewComment(e.target.value)}
                            placeholder="Ví dụ: Đồ uống siêu đậm vị, không gian bày trí mang nét cổ kính rêu phong, nhân viên nhiệt tình nhẹ nhàng..."
                            className="w-full text-xs font-medium border-2 border-[#2D3047] rounded-xl px-3 py-2.5 bg-[#FAF8F5] focus:bg-white focus:outline-hidden resize-none"
                          />
                        </div>

                        <button
                          id="btn-add-review-action"
                          type="button"
                          onClick={() => {
                            if (!newReviewComment.trim()) return;
                            
                            // Ghép các tiêu chí trải nghiệm được chọn vào nội dung bình luận
                            const tags = `[Giá: ${reviewPrice} • Suất ăn: ${reviewQuantity} • Vệ sinh: ${reviewHygiene} • Không gian: ${reviewSpace} • Để xe: ${reviewParking}]`;
                            const finalComment = `${tags}\n${newReviewComment.trim()}`;
                            
                            const reviewToAdd: Review = {
                              id: 'rev_' + Date.now(),
                              rating: newReviewRating,
                              comment: finalComment,
                              createdAt: new Date().toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                            };
                            setEditReviews(prev => [reviewToAdd, ...prev]);
                            setNewReviewComment('');
                            setNewReviewRating(5);
                            
                            // Reset các tiêu chí về mặc định
                            setReviewPrice('vừa');
                            setReviewQuantity('no');
                            setReviewHygiene('sạch sẽ');
                            setReviewSpace('rộng rãi - thoáng mát');
                            setReviewParking('có');
                          }}
                          className="inline-flex items-center gap-1 bg-[#2D3047] hover:bg-stone-800 text-white font-bold p-2 px-4 rounded-xl text-[10px] uppercase cursor-pointer tracking-wider active:translate-y-0.5 select-none"
                        >
                          ➕ Thêm Đánh Giá
                        </button>

                      </div>

                      {/* Danh sách các đánh giá cũ gói gọn như phần quán tủ */}
                      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                        {editReviews.length > 0 ? (
                          editReviews.map((rev) => (
                            <div
                              key={rev.id}
                              className="bg-[#FAF8F5] border-2 border-[#2D3047] rounded-2xl p-3 shadow-[2.5px_2.5px_0px_#2D3047] hover:bg-white hover:shadow-[4px_4px_0px_#2D3047] transition-all duration-150 flex flex-col gap-2 justify-between"
                            >
                              <div className="flex items-center justify-between text-[10px] font-black text-stone-500 border-b border-dashed border-stone-200 pb-1.5">
                                <span className="text-[#FF6B35]">
                                  {"⭐".repeat(rev.rating)}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span>{rev.createdAt}</span>
                                  <button
                                    type="button"
                                    onClick={() => setEditReviews(prev => prev.filter(r => r.id !== rev.id))}
                                    className="text-red-500 hover:text-red-700 font-bold hover:scale-110 cursor-pointer p-0.5 rounded transition-all"
                                    title="Xóa đánh giá này"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-stone-700 font-medium leading-relaxed font-sans">{rev.comment}</p>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 border-2 border-dashed border-stone-200 rounded-2xl bg-white">
                            <p className="text-xs text-stone-400 italic font-medium">Chưa có đánh giá nào cho quán này. Hãy thêm đánh giá đầu tiên ở phía trên nhé!</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side: weather criteria & Maps shortcut view */}
              <div className="lg:col-span-12 xl:col-span-4 space-y-6">
                <div className="bg-[#FAF8F5] border-2 border-[#2D3047] rounded-3xl p-5 shadow-[4px_4px_0px_#2D3047]">
                  <h3 className="text-xs font-black text-[#2D3047] uppercase tracking-wider mb-4 border-b border-stone-200 pb-2 font-bold">
                    🌦️ NHÀ KHÍ TƯỢNG HỌC
                  </h3>
                  <p className="text-[11px] text-stone-500 mb-3 font-semibold leading-relaxed">
                    Chọn các trạng thái thời tiết phù hợp để Trợ lý ẩm thực AI dễ dàng đề xuất:
                  </p>

                   <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 'hot', label: '🔥 Nóng' },
                      { val: 'cold', label: '❄️ Lạnh' },
                      { val: 'cool', label: '🍃 Mát' }
                    ].map((item) => {
                      const isSelected = editBestWeather.includes(item.val);
                      return (
                        <button
                          id={`btn-edit-weather-${item.val}`}
                          type="button"
                          key={item.val}
                          onClick={() => {
                            setEditBestWeather(prev =>
                              prev.includes(item.val)
                                ? prev.filter(v => v !== item.val)
                                : [...prev, item.val]
                            );
                          }}
                          className={`text-xs font-black p-2 rounded-xl border-2 border-[#2D3047] transition-all cursor-pointer text-center flex flex-col justify-center items-center gap-1 ${
                            isSelected
                              ? 'bg-[#FFD166] text-[#2D3047] shadow-[2px_2px_0px_#2D3047]'
                              : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50 font-bold'
                          }`}
                        >
                          <span className="text-sm">{item.label.split(' ')[0]}</span>
                          <span className="text-[10px] uppercase font-bold">{item.label.split(' ')[1]}</span>
                          {isSelected && <Check className="w-3 h-3 text-[#2D3047] stroke-[3.5] mt-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-[#FFFBF5] border-4 border-[#2D3047] rounded-3xl p-5 shadow-[4px_4px_0px_#2D3047] text-[#2D3047] flex flex-col gap-3">
                  <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 font-bold">
                    🗺️ Google Bản Đồ Lối Tắt
                  </h3>
                  <p className="text-[10px] text-stone-600 font-semibold leading-relaxed">
                    Liên kết trực tiếp tới ứng dụng Google Maps tìm kiếm tên quán giúp bạn tra cứu nhanh thông tin khác.
                  </p>

                  <a
                    id="btn-edit-maps-search"
                    href={getGoogleMapsSearchUrl(editName || selectedDetailItem.name, editAddress, editWard)}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="w-full bg-[#118AB2] hover:bg-[#159ecb] text-white font-black py-3 rounded-xl uppercase text-xs border-2 border-[#2D3047] shadow-[2px_2px_0px_#2D3047] cursor-pointer inline-flex items-center justify-center gap-1.5 text-center active:translate-y-0.5 no-underline"
                  >
                    🗺️ Tra cứu trên Google Maps
                  </a>
                </div>

                <div className="pt-4 flex flex-col gap-2">
                  <button
                    id="btn-save-edit-bottom"
                    type="submit"
                    className="w-full bg-[#06D6A0] hover:bg-[#12dda7] text-[#2D3047] font-black py-3.5 rounded-xl uppercase text-xs border-4 border-[#2D3047] shadow-[4px_4px_0px_#2D3047] cursor-pointer active:translate-y-0.5 transition-all text-center font-bold"
                  >
                    💾 Lưu tất cả chỉnh sửa
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* Left Side: Filter, Custom Form */}
            <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Section: Category Food/Drink Selector */}
          <div className="bg-white border-4 border-[#2D3047] rounded-3xl p-5 shadow-[6px_6px_0px_#2D3047]">
            <h2 className="text-lg font-black text-[#2D3047] mb-3 flex items-center gap-2">
              <span className="w-2.5 h-6 bg-[#00B4D8] rounded-full"></span> Danh Mục Vòng Quay
            </h2>
            <div className="grid grid-cols-3 gap-2">
              <button
                id="btn-cat-all"
                onClick={() => setSelectedCategory('all')}
                className={`p-2.5 rounded-xl font-bold text-xs uppercase shadow-[3px_3px_0px_#2D3047] border-2 border-[#2D3047] transition-all cursor-pointer ${
                  selectedCategory === 'all' 
                    ? 'bg-[#FFD166] text-[#2D3047]' 
                    : 'bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                🍜 Tất cả
              </button>
              <button
                id="btn-cat-food"
                onClick={() => setSelectedCategory('food')}
                className={`p-2.5 rounded-xl font-bold text-xs uppercase shadow-[3px_3px_0px_#2D3047] border-2 border-[#2D3047] transition-all cursor-pointer ${
                  selectedCategory === 'food' 
                    ? 'bg-[#EF476F] text-white' 
                    : 'bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                🍱 Chỉ món ăn
              </button>
              <button
                id="btn-cat-drink"
                onClick={() => setSelectedCategory('drink')}
                className={`p-2.5 rounded-xl font-bold text-xs uppercase shadow-[3px_3px_0px_#2D3047] border-2 border-[#2D3047] transition-all cursor-pointer ${
                  selectedCategory === 'drink' 
                    ? 'bg-[#118AB2] text-white' 
                    : 'bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                🥤 Cà phê/Trà
              </button>
            </div>

            {/* Sub-Category Filter Toolbar */}
            {availableSubCategories.length > 0 && (
              <div className="mt-4 pt-3 border-t-2 border-stone-100">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-2">
                  Danh Mục Đặc Trưng:
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                  <button
                    id="btn-subcat-all"
                    onClick={() => setSelectedSubCategory('all')}
                    className={`text-[10px] font-bold px-2.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                      selectedSubCategory === 'all'
                        ? 'bg-[#2D3047] text-white border-[#2D3047] shadow-[1px_1px_0px_#2D3047]'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    🏷️ Tất cả món
                  </button>
                  {availableSubCategories.map(cat => (
                    <button
                      id={`btn-subcat-${cat}`}
                      key={cat}
                      onClick={() => setSelectedSubCategory(cat)}
                      className={`text-[10px] font-bold px-2.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                        selectedSubCategory === cat
                          ? 'bg-[#FF6B35] text-white border-[#FF6B35] shadow-[1px_1px_0px_#2D3047]'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section: Live Google Maps Search (SerpApi) */}
          <GoogleMapsSearch 
            activeItems={items}
            onAddItem={handleImportItem}
            onRemoveItem={handleRemoveImportedItem}
            userCoords={userCoords}
            isLocating={isLocating}
            onLocateUser={handleLocateUser}
            onSetMockLocation={handleSetMockLocation}
          />

          {/* Section: Add Custom Place */}
          <div className="bg-white border-4 border-[#2D3047] rounded-3xl p-5 shadow-[6px_6px_0px_#2D3047]">
            <h2 className="text-lg font-black text-[#2D3047] mb-3 flex items-center gap-2">
              <span className="w-2.5 h-6 bg-[#06D6A0] rounded-full"></span> Thêm Quán Tủ Của Bạn
            </h2>
            <form onSubmit={handleAddNewItem} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">
                  Tên địa điểm / món ăn *
                </label>
                <input
                  id="form-item-name"
                  type="text"
                  required
                  placeholder="Ví dụ: Cà phê Nuôi, Phở chiên phồng"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full text-xs font-medium border-2 border-[#2D3047] rounded-xl px-3 py-2.5 bg-[#FAF8F5] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">
                    Loại hình
                  </label>
                  <select
                    id="form-item-type"
                    value={newItemType}
                    onChange={(e) => {
                      const val = e.target.value as 'food' | 'drink';
                      setNewItemType(val);
                      if (val === 'food') {
                        setNewItemCategory('Bún');
                      } else {
                        setNewItemCategory('Cà phê');
                      }
                      setCustomNewItemCategory('');
                    }}
                    className="w-full text-xs font-semibold border-2 border-[#2D3047] rounded-xl px-2 py-2 bg-[#FAF8F5]"
                  >
                    <option value="food">🍱 Đồ Ăn</option>
                    <option value="drink">☕ Đồ Uống</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">
                    Danh mục món
                  </label>
                  <select
                    id="form-item-category-select"
                    value={newItemCategory}
                    onChange={(e) => {
                      setNewItemCategory(e.target.value);
                      if (e.target.value !== 'custom_other') {
                        setCustomNewItemCategory('');
                      }
                    }}
                    className="w-full text-xs font-semibold border-2 border-[#2D3047] rounded-xl px-2 py-2 bg-[#FAF8F5]"
                  >
                    {(newItemType === 'food' ? foodCategories : drinkCategories).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="custom_other">✍️ Nhập danh mục mới...</option>
                  </select>
                </div>
              </div>

              {newItemCategory === 'custom_other' && (
                <div className="animate-fade-in-down">
                  <label className="text-[10px] font-black text-[#EF476F] uppercase tracking-widest block mb-1 font-extrabold animate-pulse">
                    ✏️ Gõ tên danh mục mới của bạn *
                  </label>
                  <input
                    id="form-item-custom-category"
                    type="text"
                    required
                    placeholder="Ví dụ: Đồ Hàn, Món cuốn, Trà sữa..."
                    value={customNewItemCategory}
                    onChange={(e) => setCustomNewItemCategory(e.target.value)}
                    className="w-full text-xs font-bold border-2 border-[#EF476F] rounded-xl px-3 py-2.5 bg-white focus:outline-hidden placeholder-stone-400"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">
                  Phường *
                </label>
                <select
                  id="form-item-ward"
                  value={newItemWard}
                  onChange={(e) => setNewItemWard(e.target.value)}
                  className="w-full text-xs font-semibold border-2 border-[#2D3047] rounded-xl px-2 py-2.5 bg-[#FAF8F5] focus:bg-white"
                >
                  {HANOI_MERGED_WARDS.map(ward => (
                    <option key={ward} value={ward}>{ward}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">
                  Số nhà, Tên đường (địa chỉ chi tiết)
                </label>
                <input
                  id="form-item-address"
                  type="text"
                  placeholder="Số 12 ngõ Tạm Thương"
                  value={newItemAddress}
                  onChange={(e) => setNewItemAddress(e.target.value)}
                  className="w-full text-xs font-medium border-2 border-[#2D3047] rounded-xl px-3 py-2.5 bg-[#FAF8F5] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1.5">
                  Thời tiết phù hợp nhất:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { val: 'hot', label: '🔥 Nóng' },
                    { val: 'cold', label: '❄️ Lạnh' },
                    { val: 'cool', label: '🍃 Mát' }
                  ].map((cond) => {
                    const isSelected = newItemWeather.includes(cond.val);
                    return (
                      <button
                        id={`btn-form-weather-${cond.val}`}
                        type="button"
                        key={cond.val}
                        onClick={() => {
                          setNewItemWeather(prev => 
                            prev.includes(cond.val) 
                              ? prev.filter(c => c !== cond.val) 
                              : [...prev, cond.val]
                          );
                        }}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#2D3047] text-white border-[#2D3047]'
                            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        {cond.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                id="btn-add-food"
                type="submit"
                className="w-full bg-[#06D6A0] hover:bg-[#0fd9a5] text-[#2D3047] font-black px-4 py-3 rounded-xl uppercase tracking-wider text-xs border-4 border-[#2D3047] shadow-[3px_3px_0px_#2D3047] transition-all cursor-pointer active:translate-y-0.5 active:shadow-none"
              >
                + Lưu vào thực đơn quay
              </button>
            </form>
          </div>
        </div>

        {/* Center Side: LUCKY WHEEL SPINNER */}
        <div id="lucky-wheel-center-pane" className="lg:col-span-5 flex flex-col items-center justify-start p-4 gap-6">
          <div className="text-center">
            <h2 className="text-2xl font-black text-[#2D3047] uppercase tracking-tight mt-1 mb-2">
              Vòng quay định mệnh
            </h2>
            <p className="text-xs text-stone-500 font-mono">
              Có tất cả <span className="text-[#FF6B35] font-black text-sm">{filteredItems.length}</span> món ăn gặp tiêu chuẩn lọc
            </p>
          </div>

          {/* Wheel Container (Centered and limited to max-w-[420px]) */}
          <div className="flex flex-col items-center justify-start lg:w-[420px] shrink-0 w-full">
              {/* Spinner Wheel Component */}
              <div className="bg-white/40 p-4 pb-8 rounded-3xl border-2 border-stone-200/50 backdrop-blur-xs flex justify-center w-full max-w-[420px] shadow-3xs">
                {filteredItems.length > 0 ? (
                  <LuckyWheel
                    items={filteredItems}
                    onSpinEnd={handleSpinEnd}
                    isSpinning={isSpinning}
                    setIsSpinning={setIsSpinning}
                  />
                ) : (
                  <div className="w-full py-20 text-center border-4 border-dashed border-stone-300 rounded-3xl bg-white px-6">
                    <HelpCircle className="w-12 h-12 text-stone-300 mx-auto mb-4 animate-bounce" />
                    <p className="text-sm font-black text-[#2D3047] uppercase">Không có món nào!</p>
                    <p className="text-xs text-stone-500 mt-2">
                      Bộ lọc quá ngặt nghèo dấm tỏi, vui lòng chọn thêm phường hoặc bớt điều kiện đề cử AI để vòng quay có món ăn.
                    </p>
                    <button
                      id="btn-reset-filters-inline"
                      onClick={() => {
                        setSelectedWards(HANOI_MERGED_WARDS);
                        setOnlyShowAIRecommended(false);
                        setSelectedCategory('all');
                      }}
                      className="mt-4 text-xs font-bold bg-[#FFD166] border-2 border-[#2D3047] px-4 py-2 rounded-xl text-[#2D3047] shadow-[2.5px_2.5px_0px_#2D3047] cursor-pointer"
                    >
                      Thiết lập lại bộ lọc ngay
                    </button>
                  </div>
                )}
              </div>

              {/* Dynamic location filters (wards checklists) right beside/underneath the lucky wheel */}
              <div className="mt-4 w-full bg-white border-4 border-[#2D3047] rounded-3xl p-4 shadow-[4px_4px_0px_#2D3047]">
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-stone-100">
                  <h4 className="text-[11px] font-black text-[#2D3047] uppercase tracking-wider flex items-center gap-1">
                    📍 BỘ LỌC ĐỊA ĐIỂM VÒNG QUAY ({selectedWards.length})
                  </h4>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedWards(HANOI_MERGED_WARDS)}
                      className="text-[10px] font-black text-[#FF6B35] hover:underline bg-transparent border-none cursor-pointer text-xs"
                    >
                      Chọn tất
                    </button>
                    <span className="text-stone-300 text-[10px]">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedWards([HANOI_MERGED_WARDS[0]])}
                      className="text-[10px] font-black text-stone-400 hover:underline bg-transparent border-none cursor-pointer text-xs"
                    >
                      Dọn lọc
                    </button>
                  </div>
                </div>
                <p className="text-[9px] text-stone-400 mb-2 font-bold leading-normal">
                  Chỉ chọn những quán có vị trí thuộc các phường được tích dưới đây đưa vào vòng quay:
                </p>
                <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {HANOI_MERGED_WARDS.map(ward => {
                    const isChecked = selectedWards.includes(ward);
                    return (
                      <button
                        id={`btn-wheel-ward-${ward.replace(/\s+/g, '')}`}
                        key={`wheel-ward-${ward}`}
                        type="button"
                        onClick={() => toggleWard(ward)}
                        className={`flex items-center gap-1.5 p-1.5 rounded-xl border text-left transition-all text-[10px] font-extrabold cursor-pointer truncate ${
                          isChecked
                            ? 'bg-[#FFFBF5] border-[#2D3047] text-[#2D3047] shadow-[1px_1px_0px_#2D3047]'
                            : 'bg-stone-50 border-stone-200/40 text-stone-400 hover:bg-white hover:border-stone-300'
                        }`}
                      >
                        <span className="shrink-0 flex items-center justify-center">
                          {isChecked ? (
                            <CheckSquare className="w-3.5 h-3.5 text-[#EF476F]" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-stone-300" />
                          )}
                        </span>
                        <span className="truncate">{ward.replace(/^Phường\s+/i, '')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Prompt guide info bubble */}
              <div className="mt-6 text-center max-w-[380px] bg-[#FAF8F5] px-4 py-3 rounded-2xl border border-stone-200 text-[11px] text-stone-600 leading-relaxed font-sans relative">
                <Info className="w-4 h-4 text-[#FF6B35] absolute -top-2 left-1/2 -translate-x-1/2 bg-white rounded-full p-0.5 border border-stone-200 shrink-0" />
                Vòng quay tự chia phân độ dựa trên số quán đã được lọc. Có thể click vào <span className="font-bold underline text-[#FF6B35]">QUAY NGAY!</span> hoặc nhấn trực tiếp chiếc mũi tên kim chỉ nam để bắt đầu trò chơi hoang dại.
              </div>
            </div>

            {/* Saved Custom Places Side Panel */}
            <div className="w-full bg-white border-4 border-[#2D3047] rounded-3xl p-5 shadow-[4px_4px_0px_#2D3047] flex flex-col justify-start min-h-[460px]">
              <h3 className="text-sm font-black text-[#2D3047] mb-3 uppercase tracking-wider flex items-center justify-between">
                <span>🏪 QUÁN TỦ ĐÃ LƯU ({customItems.length})</span>
                <span className="text-[9px] text-[#FF6B35] font-black bg-[#FFF1EB] px-2 py-0.5 rounded border border-red-100">local</span>
              </h3>

              {/* TWO TABS: Quán ăn & Quán nước */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  id="btn-saved-food-tab"
                  type="button"
                  onClick={() => {
                    setSavedListActiveType('food');
                    setSavedListSubCat('all');
                  }}
                  className={`py-2 rounded-xl border-2 border-[#2D3047] font-black text-xs uppercase tracking-wider transition-all shadow-[2.5px_2.5px_0px_#2D3047] cursor-pointer flex items-center justify-center gap-1.5 active:translate-y-0.5 active:shadow-none ${
                    savedListActiveType === 'food'
                      ? 'bg-[#EF476F] text-white'
                      : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <span>🍱 Quán Ăn</span>
                </button>
                <button
                  id="btn-saved-drink-tab"
                  type="button"
                  onClick={() => {
                    setSavedListActiveType('drink');
                    setSavedListSubCat('all');
                  }}
                  className={`py-2 rounded-xl border-2 border-[#2D3047] font-black text-xs uppercase tracking-wider transition-all shadow-[2.5px_2.5px_0px_#2D3047] cursor-pointer flex items-center justify-center gap-1.5 active:translate-y-0.5 active:shadow-none ${
                    savedListActiveType === 'drink'
                      ? 'bg-[#118AB2] text-white'
                      : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <span>☕ Quán Nước</span>
                </button>
              </div>

              {/* ADVANCED FILTER BOX FOR SAVED LIST */}
              <div className="bg-[#FAF8F5] border-2 border-[#2D3047] rounded-3xl p-3.5 mb-4 shadow-[2.5px_2.5px_0px_#2D3047] text-left" id="saved-list-filters-section">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-[#2D3047] uppercase tracking-widest flex items-center gap-1">
                    🔍 BỘ LỌC QUÁN TỦ
                  </span>
                  {(savedListWards.length !== HANOI_MERGED_WARDS.length || sortByDistance || savedListSubCat !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSavedListWards(HANOI_MERGED_WARDS);
                        setSortByDistance(false);
                        setSavedListSubCat('all');
                      }}
                      className="text-[9px] font-black text-rose-500 hover:underline cursor-pointer border-none bg-transparent"
                    >
                      Xóa lọc
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Ward Filter (Checkboxes) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest">
                        Chọn Phường ({savedListWards.length} đã chọn):
                      </label>
                      <div className="flex gap-1 text-[8px] font-bold">
                        <button
                          type="button"
                          onClick={() => setSavedListWards(HANOI_MERGED_WARDS)}
                          className="text-[#FF6B35] hover:underline cursor-pointer border-none bg-transparent"
                        >
                          Tất cả
                        </button>
                        <span className="text-stone-300">|</span>
                        <button
                          type="button"
                          onClick={() => setSavedListWards([HANOI_MERGED_WARDS[0]])}
                          className="text-stone-400 hover:underline cursor-pointer border-none bg-transparent"
                        >
                          Dự phòng
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-1 max-h-[100px] overflow-y-auto border border-stone-200 rounded-xl p-1.5 bg-white pr-1">
                      {HANOI_MERGED_WARDS.map(ward => {
                        const isChecked = savedListWards.includes(ward);
                        return (
                          <button
                            key={`saved-ward-${ward}`}
                            type="button"
                            onClick={() => toggleSavedListWard(ward)}
                            className={`flex items-center gap-1 p-1 rounded-sm text-left text-[9px] font-bold truncate transition-all cursor-pointer border-none ${
                              isChecked
                                ? 'bg-rose-50/10 text-[#EF476F] font-black'
                                : 'text-stone-400 bg-transparent'
                            }`}
                          >
                            <span>{isChecked ? '☑' : '☐'}</span>
                            <span className="truncate">{ward.replace(/^Phường\s+/i, '')}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Geolocation Distance Tracking */}
                  <div className="pt-2 border-t border-dashed border-stone-200">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest block">
                          Vị Trí Hiện Tại:
                        </span>
                        {userCoords && (
                          <span className="text-[8px] bg-emerald-50 text-emerald-600 font-mono px-1 py-0.5 rounded border border-emerald-100 font-black">
                            📍 Đã định vị
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          id="btn-geolocate-user"
                          type="button"
                          onClick={handleLocateUser}
                          disabled={isLocating}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl border-2 border-[#2D3047] font-black text-[9px] uppercase transition-all shadow-[1.5px_1.5px_0px_#2D3047] active:translate-y-0.5 active:shadow-none cursor-pointer ${
                            userCoords
                              ? 'bg-[#06D6A0]/10 text-[#2D3047]'
                              : 'bg-stone-50 hover:bg-stone-100 text-stone-700'
                          }`}
                        >
                          <MapIcon className="w-3 h-3 text-[#FF6B35]" />
                          {isLocating ? 'Đang lấy...' : (userCoords ? 'Cập nhật định vị' : 'Định vị hiện tại')}
                        </button>

                        {userCoords && (
                          <button
                            type="button"
                            onClick={() => setSortByDistance(!sortByDistance)}
                            className={`px-2 py-1.5 rounded-xl border-2 border-[#2D3047] font-black text-[9px] uppercase transition-all shadow-[1.5px_1.5px_0px_#2D3047] cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                              sortByDistance
                                ? 'bg-[#FF6B35] text-white shadow-none translate-y-0.5'
                                : 'bg-white hover:bg-stone-50 text-stone-600'
                            }`}
                          >
                            ⇅ Gần nhất {sortByDistance ? 'ON' : 'OFF'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sub-Category Selector */}
                  <div className="pt-2 border-t border-dashed border-stone-200">
                    <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest block mb-1">
                      Danh mục {savedListActiveType === 'food' ? 'Món Ăn' : 'Nước Uống'}:
                    </label>
                    <select
                      id="saved-list-subcat-filter"
                      value={savedListSubCat}
                      onChange={(e) => setSavedListSubCat(e.target.value)}
                      className="w-full text-[10px] font-bold border-2 border-[#2D3047] rounded-xl px-2 py-1.5 bg-white cursor-pointer focus:outline-hidden"
                    >
                      <option value="all">🏷️ Tất cả danh mục</option>
                      {(savedListActiveType === 'food' ? foodCategories : drinkCategories).map(cat => (
                        <option key={`saved-cat-opt-${cat}`} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {processedSavedItems.length > 0 ? (
                <div className="space-y-4 overflow-y-auto pr-1 max-h-[440px] flex-1">
                  <div className="space-y-2.5">
                    <div className="sticky top-0 bg-white z-10 py-1 border-b border-dashed border-stone-200 flex items-center justify-between">
                      <span className="text-[10px] font-black text-[#2D3047] uppercase tracking-wider flex items-center gap-1.5">
                        {savedListActiveType === 'food' ? '🍱 QUÁN ĂN ĐÃ LỌC' : '☕ QUÁN NƯỚC ĐÃ LỌC'} ({processedSavedItems.length})
                      </span>
                    </div>
                    {processedSavedItems.map((item) => (
                      <div 
                        key={item.id} 
                        className="bg-[#FAF8F5] border-2 border-[#2D3047] rounded-2xl p-3 shadow-[2.5px_2.5px_0px_#2D3047] hover:bg-white hover:shadow-[4.5px_4.5px_0px_#2D3047] transition-all duration-150 flex flex-col gap-2 justify-between"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-extrabold text-[#2D3047] text-xs inline leading-snug">{item.name}</h4>
                              {item.category && (
                                <span className={`text-[9px] font-black border px-1.5 py-0.5 rounded-md ${
                                  item.type === 'food'
                                    ? 'bg-[#EF476F]/10 text-[#EF476F] border-[#EF476F]/20'
                                    : 'bg-[#118AB2]/10 text-[#118AB2] border-[#118AB2]/20'
                                }`}>
                                  {item.category}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-stone-500 font-bold mt-1">
                              📍 {item.location.addressDetail ? `${item.location.addressDetail}, ` : ''}{item.location.ward}
                            </p>
                            
                            {/* Branch indicator */}
                            {item.branches && item.branches.length > 0 && (
                              <div className="mt-1 flex flex-col gap-0.5">
                                <div className="text-[9px] font-black text-[#FF6B35] bg-[#FFF2EB] border border-[#FFD166]/30 px-1.5 py-0.5 rounded inline-flex items-center gap-0.5 self-start">
                                  🏢 Có {item.branches.length} cơ sở khác
                                </div>
                                <div className="pl-2 border-l-2 border-stone-200 text-[8px] text-stone-400 font-semibold italic mt-0.5">
                                  Ví dụ: {item.branches[0].address}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-stone-600 flex-wrap">
                          {item.reviews && item.reviews.length > 0 ? (
                            <span className="bg-[#FFFBF5] text-[#EF476F] border border-[#2D3047]/15 px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                              ⭐ {(item.reviews.reduce((acc, r) => acc + r.rating, 0) / item.reviews.length).toFixed(1)} ({item.reviews.length})
                            </span>
                          ) : (
                            <span className="bg-[#FFFBF5] text-stone-400 border border-[#2D3047]/15 px-1.5 py-0.5 rounded-sm font-semibold">
                              Chưa có đánh giá
                            </span>
                          )}

                          {/* Calculated distance tag */}
                          {item.calculatedDistance !== undefined && (
                            <span className="bg-emerald-50 text-emerald-600 border border-emerald-250 px-1.5 py-0.5 rounded-sm flex items-center gap-0.5 font-bold font-mono">
                              🚗 Cách {item.calculatedDistance.toFixed(1)} km
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-1.5 border-t border-dashed border-[#2D3047]/15 pt-2 mt-0.5">
                          <button
                            id={`btn-detail-custom-item-side-${item.id}`}
                            onClick={() => setSelectedDetailItem(item)}
                            className="p-1 px-2 bg-amber-50 hover:bg-amber-100 text-[#FF6B35] border-2 border-[#2D3047] hover:shadow-[1px_1px_0px_#2D3047] rounded-lg cursor-pointer transition-all shrink-0 font-black text-[9px] uppercase flex items-center gap-1 active:translate-y-0.5 active:shadow-none"
                            title="Xem Chi tiết & Chỉnh sửa"
                          >
                            📝 Chi tiết
                          </button>
                          <a
                            id={`btn-go-custom-item-side-${item.id}`}
                            href={getGoogleMapsSearchUrl(item.name, item.location.addressDetail, item.location.ward)}
                            target="_blank"
                            referrerPolicy="no-referrer"
                            className="p-1 px-2 bg-blue-50 hover:bg-blue-100 text-[#118AB2] border-2 border-[#2D3047] hover:shadow-[1px_1px_0px_#2D3047] rounded-lg cursor-pointer transition-all shrink-0 font-black text-[9px] uppercase flex items-center gap-1 active:translate-y-0.5 active:shadow-none"
                          >
                            🗺️ Bản đồ
                          </a>
                          <button
                            id={`btn-delete-custom-item-side-${item.id}`}
                            onClick={(e) => handleDeleteItem(item.id, e)}
                            className="p-1 px-2 bg-red-50 hover:bg-red-100 text-[#EF476F] border-2 border-[#2D3047] hover:shadow-[1px_1px_0px_#2D3047] rounded-lg cursor-pointer transition-all shrink-0 active:translate-y-0.5 active:shadow-none flex items-center justify-center border-none"
                            title="Xóa khỏi tủ quán"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-stone-200 rounded-2xl bg-[#FAF8F5]">
                  <HelpCircle className="w-10 h-10 text-stone-300 mb-2.5 animate-pulse" />
                  <p className="text-xs font-bold text-[#2D3047] uppercase">Không có quán tủ khớp bộ lọc!</p>
                  <p className="text-[10px] text-stone-400 mt-1 max-w-[200px]">
                    Hãy đổi bộ lọc phường, mở rộng danh mục, lọc loại món/nước tương ứng, hoặc dùng biểu mẫu thêm quán ở cột bên trái.
                  </p>
                </div>
              )}
            </div>
        </div>

        {/* Right Side: AI WEATHER ADVISOR & HISTORY */}
        <div className="lg:col-span-3 flex flex-col gap-6">

          {/* AI Weather Advisor Chatbot section */}
          <div className="bg-[#073B4C] border-4 border-[#2D3047] rounded-3xl p-5 shadow-[6px_6px_0px_#2D3047] text-white relative flex flex-col min-h-[460px]">
            <div className="absolute -top-3.5 -right-2 bg-[#FFD166] text-[#2D3047] font-black px-3 py-0.5 rounded-lg text-[9px] uppercase tracking-wider border-2 border-[#2D3047] shadow-[2px_2px_0px_#2D3047] flex items-center gap-0.5 z-10 animate-pulse">
              <Sparkles className="w-2.5 h-2.5 fill-amber-300" /> Chatbot AI
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-black flex items-center gap-1.5 uppercase tracking-wide">
                💬 Thư ký Tú Béo
              </h2>
              {chatMessages.length > 1 && (
                <button
                  id="btn-reset-chat"
                  onClick={() => {
                    if (confirm("Bạn muốn bắt đầu cuộc hội thoại mới cùng thư ký Tú béo chứ?")) {
                      setChatMessages([
                        {
                          id: 'welcome',
                          sender: 'bot',
                          text: 'Xin chào! Mình là Tú béo đây. 🍜 Cuộc hội thoại đã được làm mới, hôm nay bạn muốn tìm quán ăn hay đồ uống gì nào?',
                          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                        }
                      ]);
                      setAiResult(null);
                    }
                  }}
                  className="text-[9px] text-[#FFD166] hover:underline font-extrabold uppercase border border-[#FFD166]/20 bg-white/5 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                >
                  Làm mới
                </button>
              )}
            </div>

            {/* Current live weather brief bar */}
            {weather && (
              <div className="bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/10 mb-3 flex items-center justify-between text-[10px] text-blue-100 font-medium select-none">
                <span className="flex items-center gap-1">
                  🌐 Hà Nội: <strong className="text-white text-[11px] font-black">{weather.temp}°C</strong>
                </span>
                <span className="truncate max-w-[140px] text-right italic text-blue-200">
                  {weather.description.replace('Bản tin thực tế: ', '')}
                </span>
              </div>
            )}

            {/* Interactive Message Area */}
            <div className="flex-1 bg-stone-950/20 border-2 border-[#2D3047] rounded-2xl p-3 overflow-y-auto max-h-[300px] min-h-[220px] lg:max-h-[450px] lg:min-h-[380px] scrollbar-thin scrollbar-thumb-white/10 flex flex-col gap-3.5">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-1 max-w-[85%] ${
                    msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] font-bold text-stone-300 uppercase tracking-wider opacity-60">
                      {msg.sender === 'user' ? '👤 Bạn' : '✨ Thư Ký Tú Béo'} • {msg.timestamp}
                    </span>
                  </div>


                  <div
                    className={`px-3 py-2 rounded-2xl text-[11px] leading-relaxed break-words font-medium select-text ${
                      msg.sender === 'user'
                        ? 'bg-[#118AB2] text-white rounded-tr-none border border-[#118AB2]/20 shadow-[1px_2px_0px_rgba(0,0,0,0.15)]'
                        : 'bg-white/10 text-stone-100 rounded-tl-none border border-white/5 shadow-[1px_2px_0px_rgba(0,0,0,0.15)]'
                    }`}
                  >
                    {renderTextWithBolds(msg.text)}

                    {/* Integrated custom place recommendations */}
                    {msg.sender === 'bot' && msg.recommendedItemIds && msg.recommendedItemIds.length > 0 && (
                      <div className="mt-3 border-t border-dashed border-white/15 pt-2 whitespace-normal text-left">
                        <p className="text-[9px] text-[#FFD166] font-black uppercase tracking-wider mb-1.5 flex items-center gap-0.5">
                          📍 Quán tủ được gợi ý ({msg.recommendedItemIds.length}):
                        </p>
                        <div className="flex flex-col gap-1 w-full">
                          {items
                            .filter((it) => msg.recommendedItemIds?.includes(it.id))
                            .map((it) => (
                              <button
                                key={it.id}
                                onClick={() => setSelectedDetailItem(it)}
                                className="w-full text-left font-bold text-stone-800 bg-stone-50 hover:bg-white text-[10px] p-1.5 rounded-lg border border-stone-200 transition-all flex items-center justify-between shadow-[1px_1px_0px_#2D3047] active:transform-none cursor-pointer"
                              >
                                <span className="truncate pr-1">🍜 {it.name} <span className="text-stone-500 font-medium text-[8px] block">📍 Phường {it.location.ward}</span></span>
                                <span className="text-[8px] font-black uppercase text-[#118AB2] shrink-0 bg-[#EBF7FF] px-1 py-0.5 rounded whitespace-nowrap">Xem 📝</span>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isChatLoading && (
                <div className="self-start flex items-center gap-1.5 bg-white/5 border border-white/5 px-3 py-2 rounded-2xl rounded-tl-none">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-amber-300 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-amber-300 rounded-full animate-bounce delay-100"></div>
                    <div className="w-1.5 h-1.5 bg-amber-300 rounded-full animate-bounce delay-200"></div>
                  </div>
                  <span className="text-[10px] font-mono text-stone-300 uppercase tracking-widest text-left">Đang suy ngẫm...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompt Suggestion Tags */}
            <div className="mt-2.5 flex flex-wrap gap-1">
              <button
                disabled={isChatLoading}
                onClick={() => {
                  setChatInput("Hôm nay thời tiết Hà Nội khá nóng bức, tôi muốn ăn gì đó mát mẻ tủ nhà");
                }}
                className="text-[9px] bg-white/5 hover:bg-white/10 text-blue-200 hover:text-white px-2 py-1 rounded-md border border-white/10 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                🌞 Trời nóng ăn gì?
              </button>
              <button
                disabled={isChatLoading}
                onClick={() => {
                  setChatInput("Bảo mình vài quán ăn ấm áp thích hợp hôm mưa lạnh rét mướt");
                }}
                className="text-[9px] bg-white/5 hover:bg-white/10 text-blue-200 hover:text-white px-2 py-1 rounded-md border border-white/10 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                🌧️ Phù hợp mưa rét
              </button>
              <button
                disabled={isChatLoading}
                onClick={() => {
                  setChatInput("Tâm sự bún chả Obama xem có cơ sở nào khác không");
                }}
                className="text-[9px] bg-white/5 hover:bg-white/10 text-blue-200 hover:text-white px-2 py-1 rounded-md border border-white/10 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                🍖 Thèm Bún Chả tủ
              </button>
            </div>

            {/* Message input panel */}
            <div className="mt-3 flex gap-2 border-t border-dashed border-white/15 pt-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendChatMessage();
                  }
                }}
                disabled={isChatLoading}
                placeholder={isChatLoading ? "Đang soạn câu trả lời..." : "Hỏi món nước hợp thời tiết..."}
                className="flex-1 text-xs px-3 py-2 bg-stone-900 border-2 border-[#2D3047] rounded-xl text-white placeholder-stone-400 focus:outline-hidden focus:border-[#FFD166] focus:ring-1 focus:ring-[#FFD166]/20 disabled:opacity-50 font-bold"
              />
              <button
                id="btn-chatbot-send"
                onClick={handleSendChatMessage}
                disabled={isChatLoading || !chatInput.trim()}
                className="bg-[#FFD166] hover:bg-[#ffe094] disabled:bg-stone-600 disabled:text-stone-400 text-[#2D3047] font-black px-3 py-2 rounded-xl text-xs uppercase border-2 border-[#2D3047] shadow-[2px_2px_0px_#2D3047] transition-all cursor-pointer flex items-center justify-center disabled:transform-none disabled:shadow-none shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Filter coupling switch indication */}
            {aiResult && aiResult.suggestedItems && aiResult.suggestedItems.length > 0 && (
              <div className="mt-2.5 bg-[#06D6A0]/10 border border-[#06D6A0]/20 p-2 rounded-xl flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1 text-[#06D6A0] font-black">
                  🎯 Đã lọc {items.filter(it => aiResult.suggestedItems.includes(it.id)).length} quán khớp gợi ý chat!
                </span>
                <button
                  onClick={() => {
                    setOnlyShowAIRecommended(prev => !prev);
                  }}
                  className={`px-2 py-0.5 rounded text-[9px] font-black uppercase transition-all border-2 border-[#2D3047] shadow-[1px_1px_0px_#2D3047] active:translate-y-0.5 cursor-pointer ${
                    onlyShowAIRecommended 
                      ? 'bg-[#EF476F] text-white hover:bg-[#ff5d84]' 
                      : 'bg-[#FFD166] text-[#2D3047] hover:bg-[#ffe094]'
                  }`}
                >
                  {onlyShowAIRecommended ? "✕ Bỏ Lọc" : "💡 Bật Lọc Tủ"}
                </button>
              </div>
            )}
          </div>

          {/* Rolling Spin History */}
          <div className="bg-white border-4 border-[#2D3047] rounded-3xl p-5 shadow-[6px_6px_0px_#2D3047] flex-1 min-h-[180px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b-2 border-stone-100 pb-2">
                <h2 className="text-lg font-black text-[#2D3047] flex items-center gap-1.5">
                  <History className="w-4 h-4 text-stone-600" /> Lịch Sử Quay
                </h2>
                {spinHistory.length > 0 && (
                  <button
                    id="btn-clear-history"
                    onClick={() => {
                      if (confirm('Bạn muốn dọn sạch nhật ký quay chứ?')) {
                        setSpinHistory([]);
                      }
                    }}
                    className="text-[10px] text-stone-400 hover:text-stone-600 hover:underline cursor-pointer"
                  >
                    Xóa sạch
                  </button>
                )}
              </div>

              <div id="spin-history-rows" className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {spinHistory.map((hist, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border-b border-dashed border-[#2D3047]/15">
                    <div>
                      <span className="font-bold text-xs text-stone-800">{hist.item.name}</span>
                      <p className="text-[9px] text-stone-400 mt-0.5">
                        {hist.item.type === 'food' ? '🍱 Đồ ăn' : '☕ Đồ uống'} • Phường {hist.item.location.ward}
                      </p>
                    </div>
                    <span className="text-[9px] bg-stone-100 px-1.5 py-0.5 rounded text-[#2D3047] font-bold font-mono">
                      {hist.timestamp}
                    </span>
                  </div>
                ))}
                
                {spinHistory.length === 0 && (
                  <div className="py-6 text-center">
                    <p className="text-xs text-stone-400 italic">Vòng quay chưa vận động hôm nay.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Default Restorer at bottom */}
            <div className="pt-4 mt-auto">
              <button
                id="btn-restore-defaults"
                onClick={handleResetDefaults}
                className="w-full text-[10px] text-center font-bold text-[#FF6B35] hover:underline cursor-pointer"
              >
                Khôi phục danh sách ẩm thực mặc định Hà Nội
              </button>
            </div>
          </div>

        </div>
        </>
        )}
      </main>

      {/* Celebratory Winning Modal! */}
      {showWinModal && winningItem && (
        <div id="win-celebration-modal" className="fixed inset-0 bg-[#2D3047]/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFF9F2] border-4 border-[#2D3047] rounded-[36px] max-w-lg w-full p-6 md:p-8 shadow-[12px_12px_0px_#2D3047] relative overflow-hidden animate-float">
            
            {/* Top Close button */}
            <button
              id="btn-close-win-modal"
              onClick={() => setShowWinModal(false)}
              className="absolute top-4 right-4 p-2 bg-white border-2 border-[#2D3047] hover:bg-stone-100 rounded-full cursor-pointer shadow-[2px_2px_0px_#2D3047] transition-all"
            >
              <X className="w-4 h-4 text-[#2D3047]" />
            </button>

            {/* Vintage Ribbon Header Banner */}
            <div className="text-center mb-6">
              <span className="text-sm font-black text-[#FF6B35] uppercase tracking-widest block mb-1">🎉 Chúc mừng bạn đã trúng!</span>
              <div className="inline-block bg-[#FFD166] text-[#2D3047] font-black border-4 border-[#2D3047] px-8 py-2.5 rounded-2xl shadow-[4px_4px_0px_#2D3047] uppercase text-xl md:text-2xl tracking-wide rotate-2">
                Hôm nay chén món này!
              </div>
            </div>

            <div className="bg-white border-4 border-[#2D3047] rounded-3xl p-5 mb-5 shadow-[4px_4px_0px_#2D3047] space-y-4">
              <div>
                <span className="text-[10px] bg-[#EF476F] text-white font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {winningItem.type === 'food' ? '🍱 Đồ Ăn Hà Nội' : '☕ Đồ uống/Quán Cà phê'}
                </span>
                <h3 className="text-2xl font-black text-[#2D3047] leading-tight mt-2.5 font-serif">
                  {winningItem.name}
                </h3>
              </div>

              {/* Address details */}
              <div className="space-y-4 py-1 text-sm text-stone-700">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-5 h-5 text-[#EF476F] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-stone-800">Địa chỉ:</p>
                    <p className="text-xs text-stone-600 font-medium mt-0.5">
                      {winningItem.location.addressDetail ? `${winningItem.location.addressDetail}, ` : ''}
                      {winningItem.location.ward}, Hà Nội
                    </p>
                    
                    {/* Google Maps Shortcut Link */}
                    <a
                      id="link-google-maps"
                      href={getGoogleMapsSearchUrl(winningItem.name, winningItem.location.addressDetail, winningItem.location.ward)}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-white bg-[#118AB2] hover:bg-[#159ecb] border-2 border-[#2D3047] px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_#2D3047] active:translate-y-0.5 active:shadow-[1px_1px_0px_#2D3047] transition-all no-underline shrink-0"
                    >
                      🗺️ Chỉ đường Google Maps
                    </a>
                  </div>
                </div>


                {winningItem.branches && winningItem.branches.length > 0 && (
                  <div className="space-y-1.5 border-t border-dashed border-[#2D3047]/15 pt-3 text-left">
                    <span className="text-[10px] font-black text-[#118AB2] uppercase tracking-widest block">
                      🏢 Các cơ sở khác của quán ({winningItem.branches.length}):
                    </span>
                    <div className="max-h-[110px] overflow-y-auto space-y-1.5 pr-1 hover:overscroll-contain">
                      {winningItem.branches.map((br) => (
                        <div key={br.id} className="flex items-center justify-between bg-stone-50 border border-stone-200 p-2 rounded-xl text-xs">
                          <div>
                            <span className="font-bold text-stone-800 block text-[11px]">{br.name}</span>
                            <span className="text-stone-500 block text-[10px] mt-0.5 font-medium">📍 {br.address}</span>
                          </div>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${winningItem.name} ${br.address}`)}`}
                            target="_blank"
                            referrerPolicy="no-referrer"
                            className="text-[10px] font-extrabold text-[#118AB2] hover:underline whitespace-nowrap ml-2 shrink-0 bg-white border border-stone-300 px-1.5 py-0.5 rounded-md shadow-[1px_1px_0px_#2D3047] no-underline"
                          >
                            🗺️ Bản đồ
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {winningItem.reviews && winningItem.reviews.length > 0 ? (
                  <div className="space-y-2 border-t border-dashed border-[#2D3047]/15 pt-3">
                    <span className="text-[10px] font-black text-[#FF6B35] uppercase tracking-widest block mb-1">
                      ⭐ Đánh giá nổi bật ({winningItem.reviews.length} đánh giá):
                    </span>
                    <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1">
                      {winningItem.reviews.map((rev) => (
                        <div key={rev.id} className="bg-[#FAF8F5] border-2 border-[#2D3047] rounded-xl p-2.5 shadow-[2px_2px_0px_#2D3047] text-xs">
                          <div className="flex items-center justify-between text-[10px] font-bold text-stone-500 mb-1">
                            <span>{"⭐".repeat(rev.rating)}</span>
                            <span>{rev.createdAt}</span>
                          </div>
                          <p className="font-medium text-stone-700 leading-normal">{rev.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-dashed border-[#2D3047]/15 pt-3">
                    <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-0.5">
                      Đánh giá:
                    </span>
                    <p className="text-xs text-stone-400 italic">Chưa có đánh giá nào cho quán này. Kính mời bạn vào trang Chi tiết để thêm nhận xét nhé!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                id="btn-spin-again"
                onClick={() => {
                  setShowWinModal(false);
                  setIsSpinning(true);
                  // Trigger programmatic click spinner in background
                  const spinButton = document.getElementById('btn-spin-wheel');
                  if (spinButton) spinButton.click();
                }}
                className="bg-white hover:bg-stone-100 text-[#2D3047] font-black py-3 rounded-xl uppercase text-xs border-4 border-[#2D3047] shadow-[4px_4px_0px_#2D3047] cursor-pointer"
              >
                🔄 Không ưng, quay lại
              </button>
              <button
                id="btn-accept-win"
                onClick={() => setShowWinModal(false)}
                className="bg-[#06D6A0] hover:bg-[#12dda7] text-[#2D3047] font-black py-3 rounded-xl uppercase text-xs border-4 border-[#2D3047] shadow-[4px_4px_0px_#2D3047] cursor-pointer"
              >
                💚 Đi thôi, xuất phát!
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Footer Bar */}
      <footer id="hanoi-footer" className="mt-auto h-14 bg-[#2D3047] text-white flex flex-col md:flex-row items-center px-8 justify-between text-[11px] font-bold shrink-0 gap-2 border-t-4 border-[#FF6B35] py-2">
        <div className="flex gap-4">
          <span>© 2026 LAMBOM WHEEL</span>
          <span className="text-gray-400">|</span>
          <span>DỮ LIỆU TỰ ĐỘNG ĐO ĐẠC METEO API</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          AI SẴN SÀNG PHÂN TÍCH VÙNG QUAY MAY MẮN
        </div>
      </footer>

    </div>
  );
}
