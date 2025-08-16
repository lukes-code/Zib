import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import alienBg from "@/assets/images/ufo.jpg";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-toastify";

type StoreItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  stock: number;
};

const Storefront = () => {
  useEffect(() => {
    document.title = "Store | My Platform";
  }, []);

  return (
    <main className="relative bg-gray-50 flex-1 bg-background overflow-auto sm:ml-[96px] transition-all duration-300">
      {/* Background image */}
      <div
        className="absolute top-0 left-0 w-full h-[400px] bg-cover bg-center"
        style={{ backgroundImage: `url(${alienBg})` }}
      />

      {/* Page content */}
      <section className="relative z-10 container mx-auto px-6 pt-12 space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-white drop-shadow">Store</h1>
        </header>

        <Separator />

        <section>
          {/* UFO */}
          <div className="relative mt-15 z-10 flex flex-col items-center justify-center space-y-6">
            <div className="animate-float relative w-52 h-28">
              {/* Dome */}
              <div className="absolute top-[-20px] left-16 w-20 h-12 bg-blue-400/50 backdrop-blur-sm rounded-full shadow-inner border border-blue-200"></div>

              {/* Saucer body */}
              <div className="absolute w-52 h-8 bg-gradient-to-r from-gray-600 via-gray-400 to-gray-600 rounded-full border border-gray-500 shadow-lg"></div>

              {/* Outer lights */}
              <div className="absolute top-3 w-full flex justify-between px-3">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full bg-yellow-300 shadow-lg animate-light-flicker`}
                    style={{ animationDelay: `${i * 0.15}s` }}
                  ></div>
                ))}
              </div>

              {/* Beam */}
              <div className="absolute top-6 left-20 w-12 h-44 bg-gradient-to-b from-yellow-400/50 to-transparent rounded-t-full filter blur-md animate-beam"></div>

              {/* Shadow on ground */}
              <div className="absolute top-28 left-0 w-full flex justify-center">
                <div className="w-24 h-2 bg-black/30 rounded-full blur-md animate-shadow"></div>
              </div>
            </div>

            {/* Text */}
            <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg">
              Coming Soon
            </h1>
          </div>

          {/* Animations */}
          <style>
            {`
          @keyframes float {
            0% { transform: translateY(0px) rotateZ(0deg); }
            25% { transform: translateY(-15px) rotateZ(1deg); }
            50% { transform: translateY(-25px) rotateZ(-1deg); }
            75% { transform: translateY(-15px) rotateZ(1deg); }
            100% { transform: translateY(0px) rotateZ(0deg); }
          }
          .animate-float {
            animation: float 4s ease-in-out infinite;
          }

          @keyframes beam {
            0%, 100% { opacity: 0.2; transform: scaleY(1); }
            50% { opacity: 0.5; transform: scaleY(1.25); }
          }
          .animate-beam {
            animation: beam 2.5s ease-in-out infinite;
          }

          @keyframes light-flicker {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.3); }
          }
          .animate-light-flicker {
            animation: light-flicker 1.2s infinite;
          }

          @keyframes shadow {
            0%, 100% { transform: scaleX(1); opacity: 0.3; }
            50% { transform: scaleX(1.1); opacity: 0.5; }
          }
          .animate-shadow {
            animation: shadow 4s ease-in-out infinite;
          }
        `}
          </style>
        </section>
      </section>
    </main>
  );
};

export default Storefront;
