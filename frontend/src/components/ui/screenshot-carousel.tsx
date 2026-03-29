import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SLIDES = [
  { src: "/images/slide1.png", caption: "Creator dashboard — review pending videos" },
  { src: "/images/slide2.png", caption: "Video detail — approve or reject with feedback" },
  { src: "/images/slide3.png", caption: "Editor view — track submission status" },
  { src: "/images/slide4.png", caption: "YouTube upload — one click to publish" },
];

export function ScreenshotCarousel() {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const t = setInterval(() => goTo((current + 1) % SLIDES.length), 4000);
    return () => clearInterval(t);
  }, [current]);

  const goTo = (index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrent(index);
    setTimeout(() => setIsAnimating(false), 400);
  };

  const prev = () => goTo((current - 1 + SLIDES.length) % SLIDES.length);
  const next = () => goTo((current + 1) % SLIDES.length);

  return (
    <div className="w-full max-w-4xl mx-auto select-none">
      {/* Browser chrome */}
      <div className="rounded-2xl overflow-hidden shadow-2xl shadow-indigo-200/40 border border-gray-200">
        {/* Title bar */}
        <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-white border border-gray-200 rounded-md px-4 py-1 text-xs text-gray-400 w-52 text-center">
              medialayer.vercel.app
            </div>
          </div>
          <div className="w-16" />
        </div>

        {/* Screenshot */}
        <div className="relative bg-white overflow-hidden" style={{ aspectRatio: "16/9" }}>
          {SLIDES.map((slide, i) => (
            <img
              key={slide.src}
              src={slide.src}
              alt={slide.caption}
              className={`absolute inset-0 w-full h-full object-contain transition-all duration-400 ${
                i === current ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"
              }`}
            />
          ))}

          {/* Arrow buttons */}
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border border-gray-200 shadow-md flex items-center justify-center hover:bg-white transition-colors z-10"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border border-gray-200 shadow-md flex items-center justify-center hover:bg-white transition-colors z-10"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Caption + dots */}
      <div className="mt-5 flex flex-col items-center gap-3">
        <p className="text-sm text-gray-500 font-medium">{SLIDES[current].caption}</p>
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? "bg-indigo-600 w-8" : "bg-gray-300 w-1.5"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
