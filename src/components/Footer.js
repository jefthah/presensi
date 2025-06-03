// components/Footer.js
import Image from "next/image";
export default function Footer() {
  return (
    <footer className="bg-[#212e72] py-8 mt-8 text-white">
      <div className="max-w-screen-xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 px-6 sm:px-12 text-sm mt-10">
        {/* Contact Section */}
        <div>
          <h3 className="font-bold text-2xl mb-4">Contact</h3>
          <p className="text-[#8e99c6] mb-2">
            Universitas Pembangunan Nasional Veteran Jakarta
          </p>
          <p className="text-[#8e99c6] mb-2">
            Jl. RS. Fatmawati, Pondok Labu, Jakarta Selatan, DKI Jakarta. 12450.
          </p>
          <p className="text-[#8e99c6] mb-2">+6221-765 6971</p>
          <p className="text-[#8e99c6] mb-2">elearning@upnvj.ac.id</p>
        </div>

        {/* University Section */}
        <div>
          <h3 className="font-semibold text-2xl mb-4">University</h3>
          <ul className="text-[#8e99c6]">
            <li className="mb-2">
              <a href="#" className="hover:underline">
                Portal UPNVJ
              </a>
            </li>
            <li className="mb-2">
              <a href="#" className="hover:underline">
                About Us
              </a>
            </li>
            <li className="mb-2">
              <a href="#" className="hover:underline">
                Contact
              </a>
            </li>
          </ul>
        </div>

        {/* Faculty Section */}
        <div>
          <h3 className="font-semibold text-2xl mb-4">Faculty</h3>
          <ul className="text-[#8e99c6]">
            <li className="mb-2">
              <a href="#" className="hover:underline">
                Economics and Business
              </a>
            </li>
            <li className="mb-2">
              <a href="#" className="hover:underline">
                Medicine
              </a>
            </li>
            <li className="mb-2">
              <a href="#" className="hover:underline">
                Engineering
              </a>
            </li>
            <li className="mb-2">
              <a href="#" className="hover:underline">
                Law
              </a>
            </li>
          </ul>
        </div>

        {/* Learning Resources Section */}
        <div>
          <h3 className="font-semibold text-2xl mb-4">Learning Resources</h3>
          <ul className="text-[#8e99c6]">
            <li className="mb-2">
              <a href="#" className="hover:underline">
                Library
              </a>
            </li>
            <li className="mb-2">
              <a href="#" className="hover:underline">
                Journal
              </a>
            </li>
          </ul>
        </div>

        {/* Get Mobile Moodle Section */}
        <div>
          <h3 className="font-semibold text-white text-3xl mb-4">
            Get Mobile Moodle
          </h3>
          <div className="flex gap-6">
            {" "}
            {/* Increased gap for more space */}
            {/* Apple Store Icon */}
            <a
              href="#"
              className="flex items-center gap-3 text-white p-3 rounded-md"
            >
              <i className="fa fa-apple text-7xl"></i>{" "}
              {/* Apple Icon - Larger size */}
              <span className="font-light">App Store</span>
            </a>
            {/* Google Play Icon */}
            <a
              href="#"
              className="flex items-center gap-3 text-white p-3 rounded-md"
            >
              <i className="fa fa-android text-7xl"></i>{" "}
              {/* Google Play Icon - Larger size */}
              <span className="font-light">Google Play</span>
            </a>
          </div>
        </div>
      </div>

      {/* LeADS Logo Section */}
      <div className="flex justify-center mt-8">
        <Image
          src="/images/logo/leads_poppins.png"
          alt="LeADS Logo"
          width={192} // sesuai w-48 (48 * 4 = 192px)
          height={0} // atau biarkan auto rasio
          className="w-48 h-auto"
          loading="lazy" // ✅ Tambahkan untuk performa
        />
      </div>

      {/* Footer Copyright */}
      <div className="text-center text-xs mt-8 font-light">
        <p>&copy; 2021 UPN Veteran Jakarta</p>
      </div>
    </footer>
  );
}
