
import React, { useState, useRef } from 'react';
import { DownloadIcon, PrinterIcon, ArrowLeftIcon, PencilAltIcon } from '../components/ui/Icons';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// --- SUB-COMPONENTS ---

const LetterHeader: React.FC = () => (
  <div className="flex items-center justify-between border-b-4 border-primary-600 pb-4 mb-6">
    <div className="flex items-center gap-4">
      <img 
        src="https://accfikolewebsite.vercel.app/assets/logo-CsSe79S4.jpg" 
        alt="ACCF Logo" 
        className="w-20 h-20 rounded-xl shadow-sm"
        referrerPolicy="no-referrer"
      />
      <div>
        <h1 className="text-2xl font-black text-secondary tracking-tighter uppercase">All Christian Campus Fellowship</h1>
        <p className="text-sm font-bold text-primary-600 uppercase tracking-widest">ACCF Ikole Campus Chapter</p>
        <p className="text-[10px] text-gray-500 font-medium">Motto: That they all may be one (John 17:21)</p>
      </div>
    </div>
    <div className="text-right">
      <div className="bg-primary-600 text-white px-4 py-1 rounded-lg text-xs font-black uppercase tracking-widest inline-block mb-2">
        Official Correspondence
      </div>
      <p className="text-[10px] text-gray-400 font-mono uppercase">Ref: ACCF/IKL/{new Date().getFullYear()}/GEN</p>
    </div>
  </div>
);

const LetterFooter: React.FC = () => (
  <div className="mt-auto pt-8 border-t border-gray-100">
    <div className="grid grid-cols-3 gap-4 text-[10px] text-gray-500 font-medium uppercase tracking-wider">
      <div>
        <p className="font-bold text-secondary mb-1">Address</p>
        <p>Federal University Oye-Ekiti,</p>
        <p>Ikole-Ekiti Campus, Ekiti State.</p>
      </div>
      <div className="text-center">
        <p className="font-bold text-secondary mb-1">Contact</p>
        <p>+234 (0) 812 345 6789</p>
        <p>accfikole@gmail.com</p>
      </div>
      <div className="text-right">
        <p className="font-bold text-secondary mb-1">Socials</p>
        <p>FB: ACCF Ikole Campus</p>
        <p>IG: @accf_ikole</p>
      </div>
    </div>
    <div className="mt-4 text-center">
      <p className="text-[9px] text-gray-300 italic">...the fellowship of the brethren</p>
    </div>
  </div>
);

const SignatureBlock: React.FC<{ 
  signatureName: string; 
  fullName: string; 
  position: string; 
  contact: string;
  closing: string;
}> = ({ signatureName, fullName, position, contact, closing }) => (
  <div className="mt-12">
    <p className="mb-8 font-medium">{closing},</p>
    <div className="space-y-1">
      <p className="text-2xl font-serif italic text-secondary opacity-80" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
        {signatureName || fullName}
      </p>
      <div className="w-48 h-px bg-gray-300 my-2"></div>
      <p className="font-bold text-secondary uppercase text-sm">{fullName}</p>
      <p className="text-xs text-gray-600 font-medium">{position}</p>
      {contact && <p className="text-xs text-gray-500">{contact}</p>}
    </div>
  </div>
);

// --- MAIN PAGE COMPONENT ---

const LetterheadGenerator: React.FC = () => {
  const [formData, setFormData] = useState({
    letterType: 'Official Letter',
    date: new Date().toISOString().split('T')[0],
    recipientName: '',
    recipientRole: '',
    salutation: 'Dear Sir/Ma,',
    subject: '',
    body: '',
    closing: 'Yours in His Service',
    signatureName: '',
    fullName: '',
    position: '',
    contact: ''
  });

  const letterRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!letterRef.current) return;
    
    const canvas = await html2canvas(letterRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Letter_${formData.recipientName.replace(/\s+/g, '_') || 'Official'}.pdf`);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-20">
      {/* Sidebar Form */}
      <div className="w-full lg:w-1/3 space-y-6 print:hidden">
        <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-2xl text-primary-600">
                <PencilAltIcon className="w-6 h-6" />
            </div>
            <div>
                <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Generator</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Compose Official Letters</p>
            </div>
        </div>

        <Card title="Letter Configuration">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Letter Type</label>
              <select 
                name="letterType"
                value={formData.letterType}
                onChange={handleInputChange}
                className="w-full bg-gray-50 dark:bg-secondary border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              >
                <option>Official Letter</option>
                <option>Recommendation Letter</option>
                <option>Invitation Letter</option>
                <option>Appreciation Letter</option>
                <option>Internal Memo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Date</label>
              <input 
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full bg-gray-50 dark:bg-secondary border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
            </div>
          </div>
        </Card>

        <Card title="Recipient Details">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Recipient Name/Title</label>
              <input 
                type="text"
                name="recipientName"
                placeholder="e.g. The Dean of Students"
                value={formData.recipientName}
                onChange={handleInputChange}
                className="w-full bg-gray-50 dark:bg-secondary border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Address or Role</label>
              <input 
                type="text"
                name="recipientRole"
                placeholder="e.g. Faculty of Agriculture"
                value={formData.recipientRole}
                onChange={handleInputChange}
                className="w-full bg-gray-50 dark:bg-secondary border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
            </div>
          </div>
        </Card>

        <Card title="Letter Content">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Salutation</label>
              <input 
                type="text"
                name="salutation"
                value={formData.salutation}
                onChange={handleInputChange}
                className="w-full bg-gray-50 dark:bg-secondary border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Subject</label>
              <input 
                type="text"
                name="subject"
                placeholder="LETTER OF INTRODUCTION"
                value={formData.subject}
                onChange={handleInputChange}
                className="w-full bg-gray-50 dark:bg-secondary border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold uppercase focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Body Content</label>
              <textarea 
                name="body"
                rows={8}
                placeholder="Type your letter content here..."
                value={formData.body}
                onChange={handleInputChange}
                className="w-full bg-gray-50 dark:bg-secondary border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
              />
            </div>
          </div>
        </Card>

        <Card title="Closing & Signature">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Closing Phrase</label>
              <input 
                type="text"
                name="closing"
                value={formData.closing}
                onChange={handleInputChange}
                className="w-full bg-gray-50 dark:bg-secondary border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
              <input 
                type="text"
                name="fullName"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full bg-gray-50 dark:bg-secondary border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Position/Title</label>
              <input 
                type="text"
                name="position"
                placeholder="President, ACCF Ikole"
                value={formData.position}
                onChange={handleInputChange}
                className="w-full bg-gray-50 dark:bg-secondary border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Contact (Optional)</label>
              <input 
                type="text"
                name="contact"
                placeholder="08012345678"
                value={formData.contact}
                onChange={handleInputChange}
                className="w-full bg-gray-50 dark:bg-secondary border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
            </div>
          </div>
        </Card>

        <div className="flex gap-3 pt-4">
          <Button onClick={handlePrint} variant="outline" className="flex-1 gap-2">
            <PrinterIcon className="w-5 h-5" /> Print
          </Button>
          <Button onClick={handleDownloadPDF} className="flex-1 gap-2">
            <DownloadIcon className="w-5 h-5" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="flex-1 bg-gray-200 dark:bg-secondary/50 rounded-3xl p-4 sm:p-8 overflow-x-auto flex justify-center items-start min-h-[1000px]">
        <div 
          ref={letterRef}
          className="bg-white text-gray-900 shadow-2xl origin-top scale-[0.6] sm:scale-[0.8] md:scale-100 transition-transform"
          style={{ 
            width: '210mm', 
            minHeight: '297mm', 
            padding: '20mm',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <LetterHeader />
          
          <div className="flex-1">
            <div className="flex justify-between mb-8">
              <div className="text-sm">
                <p className="font-bold uppercase text-gray-400 text-[10px] tracking-widest mb-1">Recipient:</p>
                <p className="font-bold text-secondary">{formData.recipientName || '[Recipient Name]'}</p>
                <p className="text-gray-600">{formData.recipientRole || '[Recipient Role/Address]'}</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-bold uppercase text-gray-400 text-[10px] tracking-widest mb-1">Date:</p>
                <p className="font-bold text-secondary">{new Date(formData.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            <p className="text-sm mb-6 font-medium">{formData.salutation}</p>

            {formData.subject && (
              <div className="mb-8">
                <h3 className="text-sm font-black uppercase text-secondary border-b-2 border-gray-900 inline-block pb-1">
                  {formData.subject}
                </h3>
              </div>
            )}

            <div className="text-sm leading-relaxed text-justify whitespace-pre-wrap min-h-[200px]">
              {formData.body || 'Start typing your letter content in the sidebar form to see the preview here...'}
            </div>

            <SignatureBlock 
              signatureName={formData.signatureName}
              fullName={formData.fullName || '[Full Name]'}
              position={formData.position || '[Position]'}
              contact={formData.contact}
              closing={formData.closing}
            />
          </div>

          <LetterFooter />
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; }
          .max-w-7xl { max-width: none !important; }
          .lg\\:flex-row { display: block !important; }
          .flex-1 { padding: 0 !important; background: transparent !important; }
          #letter-preview { 
            box-shadow: none !important; 
            margin: 0 !important; 
            transform: scale(1) !important;
            width: 100% !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,500&display=swap');
      `}</style>
    </div>
  );
};

export default LetterheadGenerator;
