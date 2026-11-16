export type PayrollStatus = "Pending" | "Approved" | "Completed" | "Rejected";

export interface PayrollEmployeeItem {
  id: string;
  employeeId: string;
  employeeName: string;
  accountNumber: string;
  bankName: string;
  amount: number;
  currency: "KHR" | "USD";
  status: "Pending" | "Success" | "Failed";
}

export interface PayrollItem {
  id: string;
  processingDate: string; // e.g. "14 Oct 2026"
  referenceNo: string;   // e.g. "PR2610140002"
  fileName: string;      // e.g. "payroll_oct_2026.xlsx"
  sourceAccountName: string; // e.g. "Payroll account"
  sourceAccountNumber: string; // e.g. "0098 1122 3344"
  records: number;       // e.g. 24
  totalAmount: number;   // e.g. 8240000
  fee?: number;          // e.g. 24000
  totalDebitAmount?: number; // e.g. 8264000
  currency: "KHR" | "USD";
  status: PayrollStatus;
  createdAt: string;
  uploadedBy?: string;
  remarks?: string;
  title?: string;        // e.g. "October payroll"
  processingType?: string; // e.g. "Immediate"
  items?: PayrollEmployeeItem[];
}

export interface ReviewPayrollRow {
  id: string;
  rowNumber: number;
  employeeName: string;
  accountNumber: string;
  employeeId: string;
  remarks: string;
  amount: number;
  currency: "KHR" | "USD";
  validationState: "valid" | "warning" | "error";
  message?: string;
  originalAccount?: string;
}

export interface UploadPayrollFormInput {
  sourceAccount: string;
  processingDate: string;
  currency: "KHR" | "USD";
  remarks?: string;
  file?: File | null;
}
