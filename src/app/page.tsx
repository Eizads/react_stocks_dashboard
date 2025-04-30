import { BASE_PATH } from "@/config";
export default function Home() {
  return (
    <div className="h-full overflow-hidden" style={{
              backgroundImage: `url("${BASE_PATH}/banner1.jpg")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              
            }}>
                {/* Content */}
                <div className="p-9 pt-15 md:pt-9">
       <div className="relative z-10 flex h-full w-full flex-col items-start justify-start sm:justify-center md:p-9 text-white">
       <h1 className="text-4xl  md:text-6xl lg:text-8xl font-bold leading-tight">
         Welcome to<br />
          Stocks Dashboard
           </h1>
           <p className="mt-6 text-lg md:text-xl lg:text-3xl">
             Your one-stop solution for stock market analysis
           </p>
         </div>
         </div>
    </div>
 
  )
}
