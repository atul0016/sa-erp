import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context';

interface TourSlide {
  icon: string;
  title: string;
  description: string;
  details: string[];
  highlight?: string;
  image?: string;
}

const TOUR_SLIDES: TourSlide[] = [
  {
    icon: '🎉',
    title: 'Welcome to SA ERP!',
    description: 'Your complete Enterprise Resource Planning system — built for Indian businesses with GST, TDS, E-Invoice, and multi-branch support.',
    details: [
      '10 integrated modules covering every aspect of your business',
      '59 feature-rich pages for day-to-day operations',
      'Role-based access — each user sees only what they need',
      'Built-in GST compliance with E-Invoice & E-Way Bill',
    ],
  },
  {
    icon: '🧭',
    title: 'Navigating the App',
    description: 'The sidebar on the left is your main navigation. Click any module to expand its pages.',
    details: [
      '📌 Sidebar — Click module names (Sales, Finance, etc.) to expand sub-pages',
      '🔍 Search Bar — Quickly find anything (Ctrl+K)',
      '🔔 Bell Icon — Notifications for approvals, alerts, and updates',
      '🛡️ Shield Icon — Jump to your Approval Queue',
      '🌙 Theme Toggle — Switch between Light and Dark mode',
      '❓ Help Button — Click "?" on any page for a detailed guide',
      '💬 Chat Bubble — Bottom-right chatbot answers any question instantly',
    ],
  },
  {
    icon: '📊',
    title: 'Dashboard — Your Command Center',
    description: 'The Dashboard is your home screen after login. Everything important is visible at a glance.',
    details: [
      'KPI Cards — Revenue, outstanding invoices, stock value, pending orders',
      'Charts — Sales trends over months, expense breakdown by category',
      'Recent Activity — Last 10 transactions across all modules',
      'Quick Actions — One-click shortcuts to create orders, invoices, etc.',
      'Pending Approvals — Items waiting for your sign-off',
    ],
    highlight: '/',
  },
  {
    icon: '💰',
    title: 'Finance Module (8 pages)',
    description: 'Complete double-entry accounting with Indian compliance. Manages everything from daily entries to annual statements.',
    details: [
      'Chart of Accounts — Your account tree (Assets, Liabilities, Income, Expenses). Add, edit, or organize accounts here.',
      'Journal Entries — Create debit/credit entries. Debits must equal credits. Post to update the ledger.',
      'General Ledger — Select any account to see every transaction with running balance.',
      'Trial Balance — Verify all debits = all credits at any date.',
      'Profit & Loss — Auto-generated income statement for any period.',
      'Balance Sheet — Assets = Liabilities + Equity snapshot.',
      'Bank Reconciliation — Import bank CSV → auto-match with your books → reconcile.',
      'Credit Management — Set & monitor customer credit limits. Approve/reject limit requests.',
    ],
    highlight: '/finance/accounts',
  },
  {
    icon: '📦',
    title: 'Inventory Module (7 pages)',
    description: 'Track every item, warehouse, and stock movement in real-time.',
    details: [
      'Items Master — Your product catalog with SKU, HSN code, unit, pricing, and reorder levels.',
      'Warehouses — Manage multiple storage locations with capacity tracking.',
      'Stock Ledger — Complete audit trail of every item movement (in/out/transfer).',
      'Stock Movements — Transfer between warehouses or adjust for damage/loss.',
      'Stock Valuation — Calculate total inventory value (FIFO or Weighted Average).',
      'Low Stock Alerts — Items below reorder level. Select & auto-generate Purchase Orders.',
      'Gate Pass — Track material entry/exit with RGP (returnable) and NRGP (non-returnable) passes.',
    ],
    highlight: '/inventory/items',
  },
  {
    icon: '🛒',
    title: 'Sales Module (6 pages)',
    description: 'End-to-end sales workflow — from customer creation to payment collection.',
    details: [
      'Customers — Add customers with GSTIN, contact details, and credit terms.',
      'Sales Orders — Create → Get Approval → Create Delivery → Generate Invoice. Full lifecycle.',
      'Sales Invoices — Auto-calculates GST by HSN. View, print, or generate E-Invoice.',
      'POS Terminal — Quick retail billing with barcode scan, discounts, and instant checkout.',
      'Customer Receipts — Record payments received. Auto-links to outstanding invoices.',
      'Aging Report — See overdue receivables in 30/60/90/90+ day buckets for collections follow-up.',
    ],
    highlight: '/sales/orders',
  },
  {
    icon: '🏪',
    title: 'Purchase Module (5 pages)',
    description: 'Manage procurement from vendor selection to final payment.',
    details: [
      'Vendors — Supplier database with GSTIN, payment terms, and performance tracking.',
      'Purchase Orders — Create PO → Submit for Approval → Receive via GRN → Complete. Tracks full lifecycle.',
      'GRN (Goods Receipt Note) — Record received goods with quantity matching (supports partial receipt).',
      'Purchase Invoices — Vendor invoices linked to POs and GRNs. 3-way matching.',
      'Vendor Payments — Record payments against invoices. Tracks outstanding balances per vendor.',
    ],
    highlight: '/purchase/orders',
  },
  {
    icon: '🏭',
    title: 'Manufacturing Module (8 pages)',
    description: 'Full production management — from Bill of Materials to Quality Control.',
    details: [
      'Bill of Materials (BOM) — Define product recipes: finished good + raw materials + quantities.',
      'Work Centers — Production resources (machines, lines) with capacity and rate info.',
      'Production Orders — Plan → Start → Track progress → Complete. Updates finished goods inventory.',
      'MRP Planning — Analyze demand vs stock → auto-suggest Purchase Orders for shortfalls.',
      'Job Work Challan — Track outsourced manufacturing with GST ITC-04 compliance.',
      'Shop Floor Kiosk — Real-time job tracking: Start, Pause, Record output, Log downtime.',
      'OEE Dashboard — Availability × Performance × Quality = Overall Equipment Effectiveness.',
      'QC Inspection — Quality checks on production output with pass/fail results and photo capture.',
    ],
    highlight: '/manufacturing/production',
  },
  {
    icon: '👥',
    title: 'HRM Module (5 pages)',
    description: 'Manage your workforce from onboarding to payroll.',
    details: [
      'Employees — Staff directory with department, designation, salary structure, bank details.',
      'Attendance — Mark daily attendance or import biometric data. Monthly calendar view.',
      'Leave Management — Apply → Approve/Reject. Tracks balance by type (Casual, Sick, Earned, etc.).',
      'Payroll — Process monthly salaries with auto-calculated PF, ESI, TDS, Professional Tax.',
      'Tax Declarations — Employee investment declarations (80C, 80D, HRA). Upload proofs for TDS optimization.',
    ],
    highlight: '/hrm/employees',
  },
  {
    icon: '🧾',
    title: 'GST & Tax Module (7 pages)',
    description: 'Complete Indian GST compliance — E-Invoice, E-Way Bill, returns, and reconciliation.',
    details: [
      'E-Invoice — Generate IRN (Invoice Reference Number) via NIC portal with auto QR code.',
      'E-Way Bill — Required for goods movement >₹50,000. Generate, extend validity, update vehicle.',
      'GSTR-1 — Outward supply return auto-populated from sales invoices. Download JSON for portal.',
      'GSTR-2B Reconciliation — Upload 2B data → auto-match with purchase records → review mismatches.',
      'TDS Management — Track TDS deductions (194C, 194J, etc.), deposits, and generate Form 26Q.',
      'ITC Reconciliation — Compare claimed ITC with GSTR-2A available credit.',
      'HSN Summary — HSN/SAC-wise summary with taxable value, CGST, SGST, IGST for returns.',
    ],
    highlight: '/gst/e-invoice',
  },
  {
    icon: '📈',
    title: 'Reports & Settings',
    description: 'Analytics dashboards and system configuration.',
    details: [
      'Financial Reports — P&L, Balance Sheet, Cash Flow statements with export.',
      'Sales Reports — Revenue trends, top customers, product-wise analysis.',
      'Purchase Reports — Vendor performance, cost analysis, PO tracking.',
      'Inventory Reports — Stock status across warehouses, movement trends.',
      'GST Reports — GSTR-3B summary, tax liability, ITC reports.',
      '─── Settings ───',
      'Company Profile — Business name, GSTIN, address, logo.',
      'Users — Create and manage user accounts with role assignment.',
      'Roles — Define what each role can see and do (70+ permissions).',
      'Master Data — UOM, tax rates, payment terms, item categories.',
    ],
    highlight: '/reports/financial',
  },
  {
    icon: '🔐',
    title: 'Roles & Permissions',
    description: 'SA ERP uses role-based access control. Each role sees only the modules and actions they need.',
    details: [
      'Admin — Full access to everything including Settings and user management.',
      'CEO / Director — Full read access everywhere + all approvals.',
      'Finance Manager — Finance, GST, Reports. Can approve journals, expenses, credit limits.',
      'Sales Manager — Sales module + Reports. Can approve Sales Orders.',
      'Purchase Manager — Purchase module + Reports. Can approve Purchase Orders.',
      'Inventory Manager — Inventory & Warehouses. Stock moves, gate passes.',
      'Production Manager — Manufacturing module. BOM, production, MRP, QC.',
      'HR Manager — HRM module. Employees, attendance, leave approval, payroll.',
      'Accountant — Day-to-day Finance & GST operations (no approvals).',
      'Sales Executive — Create sales orders and invoices (no approvals).',
      'Viewer — Read-only access across all modules.',
    ],
  },
  {
    icon: '💡',
    title: 'Pro Tips for New Users',
    description: 'Shortcuts and tricks to be productive from day one.',
    details: [
      '🔍 Ctrl+K — Global search to find any page or feature instantly.',
      '❓ "?" Button — Click on any page for detailed walkthrough of that specific page.',
      '💬 Chat Assistant — Ask the chatbot anything. It knows every feature and adjusts to your role.',
      '🔄 Typical Daily Workflow: Dashboard → Check Approvals → Process Orders → Review Reports.',
      '📊 Start with Dashboard — Get an overview, then dive into your module.',
      '⚡ Action Buttons — Look for blue/purple buttons at the top-right of each page (New, Create, Export).',
      '📤 Export Everywhere — Most tables have Export buttons to download Excel/PDF.',
      '🖨️ Print — Use the printer icon on invoices, POs, receipts for physical copies.',
      '🌙 Dark Mode — Toggle from the moon/sun icon in the header.',
      '📱 Mobile Friendly — The sidebar collapses on mobile. Tap ☰ to open.',
    ],
  },
  {
    icon: '🚀',
    title: "You're All Set!",
    description: "You now know the entire SA ERP system. Jump in and start exploring — the '?' button and chatbot are always there to help.",
    details: [
      '✅ You\'ve completed the onboarding tour!',
      '📌 This tour won\'t show again, but you can replay it from Settings.',
      '❓ Click "?" on any page for detailed, page-specific guidance.',
      '💬 The chatbot at bottom-right answers questions 24/7.',
      '🎯 Start with the Dashboard and explore one module at a time.',
    ],
  },
];

const STORAGE_KEY = 'sa_erp_onboarding_completed';

export default function OnboardingTour() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [animDir, setAnimDir] = useState<'next' | 'prev'>('next');
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!state.user) return;
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Show tour after a short delay to let the page load
      const t = setTimeout(() => setShow(true), 1200);
      return () => clearTimeout(t);
    }
  }, [state.user]);

  const close = () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const goTo = (newStep: number, dir: 'next' | 'prev') => {
    setAnimDir(dir);
    setAnimating(true);
    setTimeout(() => {
      setStep(newStep);
      setAnimating(false);
    }, 200);
  };

  const next = () => {
    if (step < TOUR_SLIDES.length - 1) goTo(step + 1, 'next');
    else close();
  };

  const prev = () => {
    if (step > 0) goTo(step - 1, 'prev');
  };

  const goToPage = (path: string) => {
    navigate(path);
    close();
  };

  if (!show) return null;

  const slide = TOUR_SLIDES[step];
  const progress = ((step + 1) / TOUR_SLIDES.length) * 100;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[580px] max-h-[90vh] flex flex-col overflow-hidden"
        style={{ animation: step === 0 ? 'tourEnter 0.4s cubic-bezier(0.34,1.56,0.64,1)' : undefined }}
      >
        {/* Progress bar */}
        <div className="h-1 bg-gray-100 flex-shrink-0">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{slide.icon}</span>
            <div>
              <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider">
                Step {step + 1} of {TOUR_SLIDES.length}
              </p>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">{slide.title}</h2>
            </div>
          </div>
          <button
            onClick={close}
            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Skip Tour
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 scrollbar-thin">
          <div className={`transition-all duration-200 ${animating ? (animDir === 'next' ? 'opacity-0 translate-x-4' : 'opacity-0 -translate-x-4') : 'opacity-100 translate-x-0'}`}>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">{slide.description}</p>

            <div className="space-y-2">
              {slide.details.map((detail, i) => {
                // Section dividers
                if (detail.startsWith('───')) {
                  return (
                    <div key={i} className="flex items-center gap-2 pt-2 pb-1">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs font-semibold text-gray-400">{detail.replace(/─/g, '').trim()}</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                  );
                }

                // Split on first — or : dash for title/description
                const dashIdx = detail.indexOf(' — ');
                const colonIdx = detail.indexOf(' — ') === -1 ? detail.indexOf(': ') : -1;
                const splitIdx = dashIdx !== -1 ? dashIdx : colonIdx;

                if (splitIdx !== -1) {
                  const title = detail.substring(0, splitIdx);
                  const desc = detail.substring(splitIdx + (dashIdx !== -1 ? 3 : 2));
                  return (
                    <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 hover:bg-indigo-50/50 transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="text-sm font-semibold text-gray-800">{title}</span>
                        <span className="text-sm text-gray-500"> — {desc}</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{detail}</span>
                  </div>
                );
              })}
            </div>

            {/* "Try it" button */}
            {slide.highlight && (
              <button
                onClick={() => goToPage(slide.highlight!)}
                className="mt-4 w-full py-2.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-200"
              >
                👉 Go to {slide.title.replace(/ \(.*/, '')} now
              </button>
            )}
          </div>
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
          <button
            onClick={prev}
            disabled={step === 0}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Back
          </button>

          {/* Dot indicators — condensed */}
          <div className="flex gap-1">
            {TOUR_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i, i > step ? 'next' : 'prev')}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'bg-indigo-500 w-4' : i < step ? 'bg-indigo-300 w-1.5' : 'bg-gray-300 w-1.5'
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
              step === TOUR_SLIDES.length - 1
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {step === TOUR_SLIDES.length - 1 ? "Let's Go! 🚀" : 'Next →'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes tourEnter {
          from { opacity: 0; transform: scale(0.92) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
