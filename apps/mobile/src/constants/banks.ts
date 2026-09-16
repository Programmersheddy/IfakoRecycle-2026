/** Popular Nigerian banks with their Paystack bank codes (sandbox list). */
export interface Bank {
  code: string;
  name: string;
}

export const NIGERIAN_BANKS: Bank[] = [
  { code: "058", name: "GTBank" },
  { code: "044", name: "Access Bank" },
  { code: "011", name: "First Bank" },
  { code: "033", name: "UBA" },
  { code: "057", name: "Zenith Bank" },
  { code: "070", name: "Fidelity Bank" },
  { code: "214", name: "FCMB" },
  { code: "050", name: "Ecobank" },
  { code: "221", name: "Stanbic IBTC" },
  { code: "232", name: "Sterling Bank" },
  { code: "032", name: "Union Bank" },
  { code: "035", name: "Wema Bank" },
  { code: "101", name: "Providus Bank" },
  { code: "082", name: "Keystone Bank" },
  { code: "076", name: "Polaris Bank" },
  { code: "301", name: "Jaiz Bank" },
  { code: "50211", name: "Kuda MFB" },
  { code: "999992", name: "OPay" },
  { code: "999991", name: "PalmPay" },
  { code: "50515", name: "Moniepoint MFB" }
];