import loginBg from "../../assets/login-bg.png";
import logo from "../../assets/bistro-bill-logo.png";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* ===== Background Image ===== */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${loginBg})` }}
      />

      {/* ===== Light Gradient Overlay ===== */}
      <div
        className="
          absolute inset-0
          bg-gradient-to-b
          from-white/50
          via-white/50
          to-white/60
        "
      />

      {/* ===== Content Wrapper ===== */}
      <div className="relative z-10 min-h-screen w-full">
        {/* Logo */}
        <div
          className="
            absolute z-10
            top-4 left-1/2 -translate-x-1/2
            sm:top-6 sm:left-6 sm:translate-x-0
            lg:top-[20px] lg:left-[50px]
          "
        >
          <img
            src={logo}
            alt="Bistro Bill Logo"
            className="
              w-[90px] h-[80px]
              sm:w-[110px] sm:h-[100px]
              lg:w-[130px] lg:h-[118.5px]
              object-contain
            "
          />
        </div>

        {/* Center Card */}
        <div className="flex items-center justify-center min-h-screen px-4">
          <div
            className="
              bg-[#FFF9EE]
              w-full
              max-w-md
              rounded-2xl
              shadow-xl
              px-6
              pb-8
              pt-16
              sm:px-8 sm:pt-14
              lg:p-8
            "
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
