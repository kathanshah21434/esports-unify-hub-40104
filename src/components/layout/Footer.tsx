
import { Link } from 'react-router-dom';
import { Instagram, Youtube, MessageSquare, Mail, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 border-t border-purple-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img 
                src="/lovable-uploads/b263082d-907f-4305-88f6-cda9b8e2ecac.png" 
                alt="Battle Mitra Logo" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-white font-bold text-xl">Battle Mitra</span>
            </div>
            <p className="text-gray-400 text-sm">
              The ultimate esports tournament platform. Compete, dominate, and conquer in your favorite games.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://www.instagram.com/battlemitra?igsh=MW9xbjdqbGo0bmZzeQ=="
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-purple-400 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="https://youtube.com/@battlemitra?si=xZjAPTkuwGkYFGIJ"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
              <a 
                href="https://chat.whatsapp.com/DML8q11tSw37V64WHehJvt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-400 transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/tournaments" className="text-gray-400 hover:text-white transition-colors">
                  Tournaments
                </Link>
              </li>
              <li>
                <Link to="/leaderboards" className="text-gray-400 hover:text-white transition-colors">
                  Leaderboards
                </Link>
              </li>
              <li>
                <Link to="/live-matches" className="text-gray-400 hover:text-white transition-colors">
                  Live Matches
                </Link>
              </li>
              <li>
                <Link to="/announcements" className="text-gray-400 hover:text-white transition-colors">
                  Announcements
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://wa.me/7984491589"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp Support</span>
                </a>
              </li>
              <li>
                <a 
                  href="tel:+7984491589"
                  className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Support</span>
                </a>
              </li>
              <li>
                <a 
                  href="mailto:battlemitra@gmail.com"
                  className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email Support</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-white font-semibold mb-4">Community</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://chat.whatsapp.com/DML8q11tSw37V64WHehJvt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  WhatsApp Community
                </a>
              </li>
              <li>
                <a 
                  href="https://www.instagram.com/battlemitra?igsh=MW9xbjdqbGo0bmZzeQ=="
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a 
                  href="https://youtube.com/@battlemitra?si=xZjAPTkuwGkYFGIJ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  YouTube
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Battle Mitra. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
