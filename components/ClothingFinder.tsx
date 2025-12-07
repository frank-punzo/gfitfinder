import React, { useState, useRef, useCallback } from 'react';
import { AnalysisResult, ClothingItem, Product } from '../types';
import { analyzeImageWithGemini, searchProductsWithGemini } from '../services/geminiService';

const ClothingFinder: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMediaType, setImageMediaType] = useState<string | null>(null);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImage(result);
        const base64 = result.split(',')[1];
        setImageBase64(base64);
        setImageMediaType(file.type);
        setResults(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const generateShoppingUrls = (searchTerms: string): Product[] => {
    const encoded = encodeURIComponent(searchTerms);
    return [
      { title: 'Amazon Search', store: 'Amazon', url: `https://www.amazon.com/s?k=${encoded}`, price: 'Check Price' },
      { title: 'Nordstrom Search', store: 'Nordstrom', url: `https://www.nordstrom.com/sr?keyword=${encoded}`, price: 'Check Price' },
      { title: 'ASOS Search', store: 'ASOS', url: `https://www.asos.com/us/search/?q=${encoded}`, price: 'Check Price' },
      { title: 'Zara Search', store: 'Zara', url: `https://www.zara.com/us/en/search?searchTerm=${encoded}`, price: 'Check Price' },
    ];
  };

  const analyzeClothing = async () => {
    if (!imageBase64 || !imageMediaType) return;
    
    setLoading(true);
    setError(null);
    setLoadingStep('Analyzing your outfit with Gemini...');
    
    try {
      // Step 1: Analyze image
      const analysisResult = await analyzeImageWithGemini(imageBase64, imageMediaType);
      
      if (!analysisResult.items || analysisResult.items.length === 0) {
        setResults(analysisResult);
        setLoading(false);
        return;
      }

      // Step 2: Search for products
      setLoadingStep('Searching stores for matching items...');
      
      const itemsWithProducts = await Promise.all(
        analysisResult.items.map(async (item, index) => {
          setLoadingStep(`Finding products for ${item.name}... (${index + 1}/${analysisResult.items.length})`);
          
          let products = await searchProductsWithGemini(item);
          
          // Fallback if no products found via API
          if (products.length === 0) {
            products = generateShoppingUrls(item.searchTerms);
          }

          return {
            ...item,
            products: products
          };
        })
      );

      setResults({
        ...analysisResult,
        items: itemsWithProducts
      });
      
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze image. Please try again.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const reset = () => {
    setImage(null);
    setImageBase64(null);
    setImageMediaType(null);
    setResults(null);
    setError(null);
  };

  return (
    <div className="w-full max-w-[390px] h-[844px] mx-auto bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a] rounded-[44px] overflow-hidden font-sans relative shadow-2xl border border-white/10">
      {/* Status Bar - Fixed at Top */}
      <div className="absolute top-0 left-0 w-full z-20 flex justify-between items-center px-7 pt-3.5 pb-2.5 text-white pointer-events-none bg-gradient-to-b from-black/60 to-transparent">
        <span className="text-[15px] font-semibold tracking-tight">9:41</span>
        <div className="flex items-center gap-1">
          <svg width="17" height="10" viewBox="0 0 17 10" fill="white">
            <path d="M1 3.5C1 2.67 1.67 2 2.5 2h1C4.33 2 5 2.67 5 3.5v5C5 9.33 4.33 10 3.5 10h-1C1.67 10 1 9.33 1 8.5v-5zM6 2.5C6 1.67 6.67 1 7.5 1h1C9.33 1 10 1.67 10 2.5v6c0 .83-.67 1.5-1.5 1.5h-1C7.67 10 7 9.33 7 8.5v-6zM11 1.5c0-.83.67-1.5 1.5-1.5h1c.83 0 1.5.67 1.5 1.5v7c0 .83-.67 1.5-1.5 1.5h-1c-.83 0-1.5-.67-1.5-1.5v-7z"/>
          </svg>
          <svg width="15" height="11" viewBox="0 0 15 11" fill="white">
            <path d="M7.5 2.5c2.7 0 5.2 1.1 7 2.9l-1.4 1.4C11.6 5.3 9.6 4.5 7.5 4.5S3.4 5.3 1.9 6.8L.5 5.4c1.8-1.8 4.3-2.9 7-2.9zm0 3c1.8 0 3.4.7 4.6 1.9l-1.4 1.4c-.8-.8-2-1.3-3.2-1.3s-2.4.5-3.2 1.3L2.9 7.4c1.2-1.2 2.8-1.9 4.6-1.9zm0 3c.8 0 1.6.3 2.1.9L7.5 11l-2.1-1.6c.5-.6 1.3-.9 2.1-.9z"/>
          </svg>
          <svg width="25" height="11" viewBox="0 0 25 11" fill="white">
            <rect x="0" y="1" width="21" height="9" rx="2" stroke="white" strokeWidth="1" fill="none"/>
            <rect x="2" y="3" width="17" height="5" rx="1" fill="white"/>
            <path d="M23 4v3a2 2 0 0 0 0-3z" fill="white"/>
          </svg>
        </div>
      </div>

      {/* Main Scroll Container - Covers Full Height */}
      <div className="w-full h-full overflow-y-auto no-scrollbar relative z-10">
        
        {/* Header - Now inside the scroll view */}
        <div className="px-6 pt-14 pb-6 text-center animate-fade-in">
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#E8D5B7] to-[#C4A77D] rounded-[10px] flex items-center justify-center text-[#1a1a1a]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>
              </svg>
            </div>
            <h1 className="font-serif text-[28px] font-medium text-white m-0 tracking-tight">StyleSeek</h1>
          </div>
          <p className="text-white/50 text-sm font-normal tracking-wide m-0">Find where to buy any outfit</p>
        </div>

        {/* Content Area */}
        <div className="px-5 pb-24">
          {!image ? (
            <div
              className={`border-2 border-dashed rounded-[20px] py-12 px-6 text-center cursor-pointer transition-all duration-300 bg-white/[0.02] ${
                dragActive ? 'border-[#C4A77D] bg-[#C4A77D]/10' : 'border-white/20'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
              />
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#E8D5B7]/15 to-[#C4A77D]/10 rounded-[20px] flex items-center justify-center text-[#C4A77D]">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
              <p className="text-white text-base font-medium mb-1.5">Tap to upload or drag a photo</p>
              <p className="text-white/40 text-[13px] m-0">JPG, PNG up to 10MB</p>
            </div>
          ) : (
            <div className="relative rounded-[20px] overflow-hidden animate-slide-up bg-black/20 flex items-center justify-center">
              <img src={image} alt="Uploaded clothing" className="w-full h-auto max-h-[500px] object-contain block" />
              <button 
                onClick={reset} 
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border-none text-white cursor-pointer flex items-center justify-center hover:bg-black/80 transition-colors shadow-lg"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          )}

          {image && !results && !loading && (
            <button 
              onClick={analyzeClothing} 
              className="w-full py-4 px-6 mt-4 bg-gradient-to-br from-[#E8D5B7] to-[#C4A77D] border-none rounded-[14px] text-[#1a1a1a] text-base font-semibold cursor-pointer flex items-center justify-center shadow-[0_4px_20px_rgba(196,167,125,0.3)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Find This Look
            </button>
          )}

          {loading && (
            <div className="text-center py-10">
              <div className="relative w-[50px] h-[50px] mx-auto mb-4">
                <div className="absolute inset-0 w-full h-full border-3 border-white/10 border-t-[#C4A77D] rounded-full animate-spin"></div>
                <div className="absolute top-2 left-2 w-[34px] h-[34px] border-2 border-white/5 border-b-[#E8D5B7] rounded-full animate-spin-slow"></div>
              </div>
              <p className="text-white/80 text-[15px] font-medium mb-3">{loadingStep}</p>
              <div className="flex items-center justify-center text-white/40 text-xs">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5 opacity-60">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>Searching Google...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center p-6 bg-[#ff6464]/10 rounded-2xl mt-4">
              <p className="text-[#ff6b6b] text-sm mb-3">{error}</p>
              <button 
                onClick={analyzeClothing} 
                className="py-2.5 px-5 bg-transparent border border-[#ff6b6b]/50 rounded-lg text-[#ff6b6b] text-sm cursor-pointer hover:bg-[#ff6b6b]/10 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {results && (
            <div className="mt-5 animate-slide-up">
              {results.overallStyle && results.items.length > 0 && (
                <div className="bg-gradient-to-br from-[#E8D5B7]/10 to-[#C4A77D]/5 rounded-2xl p-5 mb-4 border border-[#C4A77D]/20">
                  <span className="text-[11px] font-semibold text-[#C4A77D] uppercase tracking-widest">Style Detected</span>
                  <p className="text-white text-[15px] mt-1.5 leading-relaxed">{results.overallStyle}</p>
                </div>
              )}

              {results.items.length === 0 ? (
                <div className="text-center py-10 px-5">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5" className="mx-auto">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M16 16s-1.5-2-4-2-4 2-4 2"/>
                    <line x1="9" y1="9" x2="9.01" y2="9"/>
                    <line x1="15" y1="9" x2="15.01" y2="9"/>
                  </svg>
                  <p className="text-white text-base font-medium mt-4 mb-1">No clothing items detected</p>
                  <p className="text-white/40 text-[13px] m-0">Try uploading a clearer image</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {results.items.map((item, index) => (
                    <div key={index} className="bg-white/5 rounded-2xl p-4.5 border border-white/[0.08]">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-[17px] font-semibold text-white m-0 flex-1 pr-3">{item.name}</h3>
                        <span className="text-[14px] font-semibold text-[#C4A77D] whitespace-nowrap">{item.estimatedPrice}</span>
                      </div>
                      <p className="text-[13px] text-white/60 m-0 mb-3 leading-relaxed">{item.description}</p>
                      <div className="flex gap-2 mb-3.5 flex-wrap">
                        <span className="text-[11px] px-2.5 py-1 bg-white/[0.08] rounded-md text-white/70 font-medium">{item.color}</span>
                        <span className="text-[11px] px-2.5 py-1 bg-white/[0.08] rounded-md text-white/70 font-medium">{item.style}</span>
                      </div>
                      
                      {/* Product Results Section */}
                      {item.products && item.products.length > 0 ? (
                        <div className="border-t border-white/[0.08] pt-3.5">
                          <div className="flex items-center gap-2 mb-3">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C4A77D" strokeWidth="2">
                              <circle cx="9" cy="21" r="1"/>
                              <circle cx="20" cy="21" r="1"/>
                              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                            </svg>
                            <span className="text-xs font-semibold text-[#C4A77D] uppercase tracking-wide">Shop Similar</span>
                            <span className="text-[11px] text-white/40 ml-auto">{item.products.length} found</span>
                          </div>
                          <div className="flex flex-col gap-2">
                            {item.products.map((product, pIndex) => (
                              <a
                                key={pIndex}
                                href={product.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex justify-between items-center p-3 bg-gradient-to-br from-[#E8D5B7]/[0.08] to-[#C4A77D]/[0.04] rounded-[10px] no-underline border border-[#C4A77D]/15 transition-all duration-200 hover:border-[#C4A77D]/40"
                              >
                                <div className="flex-1 min-w-0 pr-3">
                                  <p className="text-[13px] font-medium text-white m-0 truncate">{product.title}</p>
                                  <p className="text-[11px] text-[#C4A77D] m-0 mt-0.5">{product.store}</p>
                                  {product.description && (
                                    <p className="text-[11px] text-white/40 m-0 mt-1 truncate">{product.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="text-[13px] font-semibold text-[#E8D5B7]">{product.price}</span>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                    <polyline points="15 3 21 3 21 9"/>
                                    <line x1="10" y1="14" x2="21" y2="3"/>
                                  </svg>
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center p-3 bg-black/20 rounded-lg text-xs text-white/40 italic mt-3">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2 opacity-50">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                          </svg>
                          <span>Search: {item.searchTerms}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button 
                onClick={reset} 
                className="w-full py-3.5 px-6 mt-5 bg-transparent border border-white/20 rounded-[14px] text-white text-[15px] font-medium cursor-pointer flex items-center justify-center hover:bg-white/5 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                </svg>
                Search New Image
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Home Indicator - Fixed at bottom */}
      <div className="absolute bottom-0 left-0 w-full h-[34px] z-20 flex items-center justify-center pointer-events-none bg-gradient-to-t from-black/80 to-transparent">
        <div className="w-[134px] h-[5px] bg-white/30 rounded-full mb-2"></div>
      </div>
    </div>
  );
};

export default ClothingFinder;