import type { TxnDirection } from "./dashboard.types";

/** Mock data for the dashboard. Replace with RTK Query endpoints when wired. */

export const cashFlow = {
  cashIn: [1500, 2100, 1700, 2600, 1900, 2400, 2000, 2800, 2300, 3000, 2500, 3400],
  cashOut: [900, 1300, 1100, 1500, 1200, 1700, 1400, 1600, 1500, 1800, 1600, 2300],
  labels: ['22', '', '27', '', '02', '', '07', '', '12', '', '17', ''],
  avgIncome: 21.57,
  avgSpending: 18.43,
};

export const pendingApprovals = [
  { label: 'Within bank transfer', amount: '2,000.00 USD' },
  { label: 'Local bank transfer', amount: '100.42 USD' },
  { label: 'International transfer', amount: '100.42 USD' },
];

export const scheduleTransfers = [
  { day: '25', month: 'JUN', label: 'Payroll Payment', amount: '5,800 USD' },
  { day: '26', month: 'JUN', label: 'Vendor Payment', amount: '7,250 USD' },
  { day: '27', month: 'JUN', label: 'Quarterly Tax Filing', amount: '15,600 USD' },
];

export const banners = [
  { image: '/assets/images/banner.png', alt: 'Promotional banner', href: '#' },
  { image: '/assets/images/banner-1.png', alt: 'Promotional banner', href: '#' },
];

/** 1 USD in KHR — used to convert USD-denominated mock amounts. */
export const USD_TO_KHR_RATE = 4036;

export const transactions: {
  title: string;
  ref: string;
  date: string;
  amount: number;
  direction: TxnDirection;
}[] = [
    { title: 'Check cleared', ref: '2819700093P2429', date: '11 June 2026', amount: -1687.22, direction: 'out' },
    { title: 'Salary Payment', ref: '50F31737720200712', date: '11 June 2026', amount: -4851.29, direction: 'out' },
    { title: 'Single transfer account', ref: '50F3172721750120', date: '11 June 2026', amount: -1686.50, direction: 'out' },
    { title: 'Single transfer account', ref: '50F3172721750121', date: '10 June 2026', amount: -86.62, direction: 'out' },
    { title: 'Incoming payment', ref: 'INC-2026-00421', date: '9 June 2026', amount: 5000.00, direction: 'in' },
  ];
