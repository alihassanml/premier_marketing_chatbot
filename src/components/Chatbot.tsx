import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, HelpCircle, ChevronRight, X, Sparkles, MapPin, Phone, Globe, ArrowRight } from 'lucide-react';

type Message = {
  type: 'bot' | 'user';
  text: string;
  timestamp: Date;
};

type Screen = 'chat' | 'faq';

const WELCOME_MESSAGE = `Hi! Welcome to Premier Marketing. We specialize in Branding, Web Design, SEO, and more. How can we help grow your business today?`;

const PremierChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [screen, setScreen] = useState<Screen>('chat');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingMessage, setTypingMessage] = useState<string | null>(null);
  const [messageQueue, setMessageQueue] = useState<string[]>([]);
  const [botBusy, setBotBusy] = useState(false);
  const [hasLoadedWelcome, setHasLoadedWelcome] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [userId] = useState(() => {
    const existing = sessionStorage.getItem("premier_user_id");
    if (existing) return existing;
    const random = `user_${Math.random().toString(36).substring(2, 10)}`;
    sessionStorage.setItem("premier_user_id", random);
    return random;
  });

  useEffect(() => {
    const savedMessages = sessionStorage.getItem(`premier_chat_messages_${userId}`);
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
        setHasLoadedWelcome(true);
      } catch (error) {
        console.error('Error loading saved messages:', error);
      }
    }
  }, [userId]);

  useEffect(() => {
    if (screen === 'chat' && messages.length === 0 && !hasLoadedWelcome) {
      setMessages([{
        type: 'bot',
        text: WELCOME_MESSAGE,
        timestamp: new Date()
      }]);
      setHasLoadedWelcome(true);
    }
  }, [screen, messages.length, hasLoadedWelcome]);

  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(`premier_chat_messages_${userId}`, JSON.stringify(messages));
    }
  }, [messages, userId]);

  const faqData = [
    {
      category: "Services",
      question: "What digital marketing services do you offer?",
      answer: "We offer a comprehensive range of services including **Branding**, **Web Design**, **SEO**, **PPC Advertising**, **Social Media Marketing**, and **CRM Automation**. We provide all the digital solutions your business needs to succeed."
    },
    {
      category: "Web Development",
      question: "What is your web development process?",
      answer: "Our process includes: **Discovery & Planning** (understanding goals), **Design** (visuals & UX), **Development** (coding), **Testing** (QA), **Launch** (deployment), and ongoing **Maintenance & Support** to keep your site secure and updated."
    },
    {
      category: "SEO",
      question: "How long does SEO take to show results?",
      answer: "SEO is a long-term strategy. While some improvements can be seen quickly, significant organic traffic growth typically takes **3 to 6 months**. Consistency in content, technical optimization, and backlink building is key to sustainable growth."
    },
    {
      category: "General",
      question: "Where is Premier Marketing located?",
      answer: "Our headquarters are located at **615 South College St, Charlotte, NC, 28202**. We serve clients locally and globally."
    },
    {
      category: "Contact",
      question: "How can I contact your team?",
      answer: "You can reach us by phone at **+1 704 368 3658** or email us directly. We also have office locations in Charlotte, NC."
    }
  ];

  const handleBotResponse = async (userMessage: string) => {
    setBotBusy(true);
    setTypingMessage("Premier agent is typing...");

    try {
        // NOTE: You might want to update this URL to a Premier Marketing specific endpoint if available
      const response = await fetch("https://n8n.srv942069.hstgr.cloud/webhook/3879797787987394847389-lead-agent", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, message: userMessage })
      });

      const data = await response.json();
      const replies = (data.reply || "").split("\\k").filter((part: string) => part.trim() !== "");

      if (replies.length === 0) {
        replies.push("Thank you for contacting Premier Marketing. We will get back to you shortly.");
      }

      for (let i = 0; i < replies.length; i++) {
        if (i > 0) {
          setTypingMessage("Premier agent is typing...");
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        setTypingMessage(null);
        setMessages(prev => [...prev, {
          type: 'bot',
          text: replies[i].trim(),
          timestamp: new Date()
        }]);

        if (i < replies.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

    } catch (error) {
      console.error('Webhook error:', error);
      setTypingMessage(null);
      setMessages(prev => [...prev, {
        type: 'bot',
        text: "I apologize, but I'm having trouble connecting right now. Please call us at +1 704 368 3658.",
        timestamp: new Date()
      }]);
    }

    setBotBusy(false);
    setMessageQueue(prev => {
      const [nextMessage, ...rest] = prev;
      if (nextMessage) {
        setTimeout(() => handleBotResponse(nextMessage), 2000);
      }
      return rest;
    });
  };

  const sendMessage = async () => {
    if (input.trim() === '') return;
    const message = input.trim();
    setInput('');
    setMessages(prev => [...prev, {
      type: 'user',
      text: message,
      timestamp: new Date()
    }]);

    if (botBusy) {
      setMessageQueue(prev => [...prev, message]);
    } else {
      await handleBotResponse(message);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setScreen('chat');
    setTimeout(() => {
      setMessages(prev => [...prev, {
        type: 'user',
        text: question,
        timestamp: new Date()
      }]);
      handleBotResponse(question);
    }, 300);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingMessage]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const parseMarkdown = (text: string) => {
    let parsed = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    parsed = parsed.replace(/__(.+?)__/g, '<strong>$1</strong>');
    parsed = parsed.replace(/\*(.+?)\*/g, '<em>$1</em>');
    parsed = parsed.replace(/_(.+?)_/g, '<em>$1</em>');
    parsed = parsed.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline">$1</a>');
    parsed = parsed.replace(/\n/g, '<br />');
    return parsed;
  };

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 15px rgba(137, 55, 161, 0.3); }
          50% { box-shadow: 0 0 25px rgba(137, 55, 161, 0.6); }
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

      {/* Main Container */}
      <div className="fixed right-4 bottom-4 sm:right-6 sm:bottom-6 z-[9999] flex flex-col items-end space-y-4 font-sans">
        
        {/* Chat Window */}
        <div 
          className={`
            transition-all duration-500 ease-out transform origin-bottom-right
            ${isOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-90 translate-y-10 pointer-events-none'}
            w-[90vw] sm:w-[400px] h-[600px] max-h-[80vh]
            bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col
            border border-[#27254a]/10
          `}
        >
          {/* Header */}
          <div className="relative overflow-hidden h-32 shrink-0">
             <div className="absolute inset-0 bg-gradient-to-br from-[#27254a] to-[#8937a1]"></div>
             
             {/* Animated Background blobs */}
             <div className="absolute top-0 -left-4 w-40 h-40 bg-[#8937a1] rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
             <div className="absolute top-0 -right-4 w-40 h-40 bg-[#27254a] rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
             <div className="absolute -bottom-8 left-20 w-40 h-40 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
             
             {/* Header Content */}
             <div className="relative z-10 p-6 h-full flex flex-col justify-center">
               <div className="flex items-start justify-between">
                 <div className="flex items-center space-x-3">
                   <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/20 shadow-lg group hover:scale-105 transition-transform duration-300">
                      <Sparkles className="w-6 h-6 text-white animate-pulse" />
                   </div>
                   <div>
                     <h2 className="text-white font-bold text-xl tracking-tight leading-tight">Premier Marketing</h2>
                     <p className="text-white/80 text-xs font-medium mt-0.5">Digital Experts in Charlotte, NC</p>
                   </div>
                 </div>
               </div>
               
               <div className="mt-4 flex items-center space-x-4 text-[10px] text-white/90 font-medium">
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Online Now</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Globe className="w-3 h-3" />
                    <span>EN</span>
                  </div>
               </div>
             </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-[#27254a]/5 p-1 mx-4 mt-4 rounded-xl relative">
            <div 
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ease-spring ${screen === 'chat' ? 'left-1' : 'left-[calc(50%+2px)]'}`}
            ></div>
            <button 
              onClick={() => setScreen('chat')}
              className={`flex-1 relative z-10 flex items-center justify-center space-x-2 py-2.5 text-sm font-semibold transition-colors duration-300 ${screen === 'chat' ? 'text-[#27254a]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat</span>
            </button>
            <button 
              onClick={() => setScreen('faq')}
              className={`flex-1 relative z-10 flex items-center justify-center space-x-2 py-2.5 text-sm font-semibold transition-colors duration-300 ${screen === 'faq' ? 'text-[#8937a1]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>FAQ</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden relative bg-gray-50/50">
            
            {/* Chat Screen */}
            <div 
              className={`absolute inset-0 flex flex-col transition-all duration-500 transform ${screen === 'chat' ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'}`}
            >
              <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-gray-200">
                {messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-[fadeInScale_0.3s_ease-out]`}
                  >
                    <div 
                      className={`
                        max-w-[85%] p-3.5 rounded-2xl shadow-sm relative text-sm leading-relaxed
                        ${msg.type === 'user' 
                          ? 'bg-gradient-to-br from-[#27254a] to-[#403d73] text-white rounded-br-sm' 
                          : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                        }
                      `}
                    >
                      <div 
                        dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.text) }}
                      />
                      <span className={`text-[10px] opacity-60 mt-1.5 block ${msg.type === 'user' ? 'text-right text-gray-200' : 'text-left text-gray-400'}`}>
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}

                {typingMessage && (
                  <div className="flex justify-start animate-[slideInLeft_0.3s_ease-out]">
                    <div className="bg-white p-4 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100">
                      <div className="flex space-x-1.5">
                        <div className="w-2 h-2 bg-[#8937a1] rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-[#8937a1] rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-[#8937a1] rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex items-center bg-gray-50 rounded-full border border-gray-200 focus-within:border-[#8937a1] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#8937a1]/20 transition-all duration-300 pr-1.5">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 bg-transparent px-5 py-3.5 focus:outline-none text-sm text-gray-700 placeholder-gray-400"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || botBusy}
                    className="p-2.5 rounded-full bg-gradient-to-r from-[#27254a] to-[#8937a1] text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105 transition-all duration-200"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* FAQ Screen */}
            <div 
              className={`absolute inset-0 overflow-y-auto p-4 space-y-3 transition-all duration-500 transform ${screen === 'faq' ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}
            >
               {/* Contact Info Card */}
               <div className="mb-4 bg-gradient-to-br from-[#27254a] to-[#403d73] rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                  <div className="relative z-10">
                    <h5 className="font-bold text-lg mb-2">Contact Us</h5>
                    <div className="space-y-2 text-sm opacity-90">
                       <div className="flex items-start space-x-2">
                         <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                         <span>615 South College St, Charlotte, NC, 28202</span>
                       </div>
                       <div className="flex items-center space-x-2">
                         <Phone className="w-4 h-4 shrink-0" />
                         <span>+1 704 368 3658</span>
                       </div>
                    </div>
                  </div>
                  <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                    <Sparkles className="w-32 h-32" />
                  </div>
               </div>

               {faqData.map((faq, index) => (
                  <details key={index} className="group bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:border-[#8937a1]/30">
                    <summary className="flex items-center justify-between p-4 cursor-pointer list-none select-none">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-[#8937a1] uppercase tracking-wider mb-0.5">{faq.category}</span>
                        <h4 className="font-medium text-[#27254a] text-sm pr-4 group-hover:text-[#8937a1] transition-colors">
                          {faq.question}
                        </h4>
                      </div>
                      <div className="bg-gray-50 p-1.5 rounded-full group-open:bg-[#8937a1]/10 group-open:rotate-90 transition-all duration-300 shrink-0">
                         <ChevronRight className="w-4 h-4 text-gray-400 group-open:text-[#8937a1]" />
                      </div>
                    </summary>
                    <div className="px-4 pb-4 animate-[fadeInScale_0.2s_ease-out]">
                      <p className="text-sm text-gray-600 leading-relaxed pl-1 border-l-2 border-[#8937a1]/20">
                         <div dangerouslySetInnerHTML={{ __html: parseMarkdown(faq.answer) }} />
                      </p>
                      <button
                        onClick={() => handleQuickQuestion(faq.question)}
                        className="mt-3 text-xs font-semibold text-[#8937a1] flex items-center hover:underline bg-[#8937a1]/5 px-3 py-1.5 rounded-full w-fit transition-colors hover:bg-[#8937a1]/10"
                      >
                         Ask related question <ArrowRight className="w-3 h-3 ml-1" />
                      </button>
                    </div>
                  </details>
               ))}
            </div>
          </div>
          
           
        </div>

        {/* Floating Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`
            relative w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-2xl flex items-center justify-center 
            transition-all duration-500 z-[9999] overflow-hidden group
            ${isOpen ? 'bg-[#120f14] rotate-90' : 'bg-gradient-to-br from-[#27254a] to-[#8937a1] rotate-0'}
            hover:scale-110 active:scale-95
          `}
          style={{ animation: !isOpen ? 'pulse-glow 3s infinite' : 'none' }}
        >
          {/* Icons container */}
          <div className="relative z-10 w-full h-full flex items-center justify-center">
             <div className={`absolute transition-all duration-500 ${isOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`}>
                <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-white/20" />
             </div>
             <div className={`absolute transition-all duration-500 ${isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`}>
                <X className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
             </div>
          </div>
           
           {/* Ripple Effect Ring */}
           {!isOpen && (
             <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-[ping_2s_infinite]"></div>
           )}
        </button>
      </div>
    </>
  );
};

export default PremierChatbot;