import { Mail, MapPin, Phone } from "lucide-react";
import Footer from "../footer";
import PublicHeader from "../publicHeader";

export default function ContactUsDemo() {
  return (
    <><PublicHeader />
    <section className="bg-[#F3F3F3] py-16 px-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-md p-8">

        {/* HEADER */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">Get In Touch With Us</h2>
          <p className="text-sm text-gray-500 mt-1">
            Have questions about Medworld Expo? Our team is ready to help.
          </p>
        </div>

        {/* CONTENT */}
        <div className="grid lg:grid-cols-2 gap-10">

          {/* ================= LEFT : FORM ================= */}
          <div className="bg-bb-bg rounded-xl p-6">
            <form className="space-y-4">

  {/* NAME */}
  <div>
    <label className="text-sm font-medium">
      Name <span className="text-red-500">*</span>
    </label>
    <input
      type="text"
      placeholder="Enter Name"
      className="w-full mt-1 border rounded-md px-3 py-2 text-sm bg-white"
    />
  </div>

  {/* EMAIL + PHONE (SAME ROW) */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

    {/* EMAIL */}
    <div>
      <label className="text-sm font-medium">
        Email Address <span className="text-red-500">*</span>
      </label>
      <input
        type="email"
        placeholder="Enter Email Address"
        className="w-full mt-1 border rounded-md px-3 py-2 text-sm bg-white"
      />
    </div>

    {/* PHONE */}
    <div>
      <label className="text-sm font-medium">
        Phone <span className="text-red-500">*</span>
      </label>

      <div className="flex mt-1 border rounded-md overflow-hidden bg-white">
        {/* COUNTRY CODE */}
        <select className="px-3 py-2 text-sm border-r bg-white focus:outline-none">
          <option>+91</option>
          <option>+1</option>
          <option>+44</option>
        </select>

        {/* NUMBER */}
        <input
          type="text"
          placeholder="000 000 0000"
          className="flex-1 px-3 py-2 text-sm focus:outline-none"
        />
      </div>
    </div>
  </div>

  {/* MESSAGE */}
  <div>
    <label className="text-sm font-medium">
      Message <span className="text-red-500">*</span>
    </label>
    <textarea
      placeholder="Enter Message"
      rows={4}
      className="w-full mt-1 border rounded-md px-3 py-2 text-sm resize-none bg-white"
    />
  </div>

  {/* BUTTONS */}
  {/* BUTTONS */}
<div className="grid grid-cols-2 gap-4 pt-2">
  <button
    type="button"
    className="
      w-full
      py-2.5
      border
      border-gray-400
      rounded-md
      text-sm
      bg-white
      font-medium
    "
  >
    Cancel
  </button>

  <button
    type="submit"
    className="
      w-full
      py-2.5
      bg-[#FDC836]
      rounded-md
      text-sm
      font-medium
      text-black
    "
  >
    Submit
  </button>
</div>


</form>

          </div>

          {/* ================= RIGHT : CONTACT INFO ================= */}
          <div className="space-y-6">

            <div>
              <h4 className="font-semibold mb-4">Contact Information</h4>

              <div className="space-y-4 text-sm text-gray-600">

                {/* Phone */}
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#E1A500] flex items-center justify-center">
                    <Phone size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-black">Phone:</p>
                    <p>+91 9050918383</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#E1A500] flex items-center justify-center">
                    <Mail size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-black">Email Address:</p>
                    <p>info@digitalworldexpo.com</p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#E1A500] flex items-center justify-center">
                    <MapPin size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-black">Office Address:</p>
                    <p>
                      L-55/193/2D, CM Layout, Kondapur,  
                      Hyderabad - 500084, Telangana, INDIA
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* MAP */}
            <div className="rounded-xl overflow-hidden border">
              <iframe
                title="map"
                className="w-full h-48"
                src="https://maps.google.com/maps?q=Kondapur%20Hyderabad&t=&z=13&ie=UTF8&iwloc=&output=embed"
              />
            </div>

            {/* SOCIAL */}
            <div>
              <p className="font-medium mb-3">Follow Us on Social Media</p>
              <div className="flex gap-3">
                {["youtube", "facebook", "twitter", "instagram"].map((i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer text-bb-primaryhover:bg-[#FDC836]"
                  />
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
    <Footer /></>
  );
}
