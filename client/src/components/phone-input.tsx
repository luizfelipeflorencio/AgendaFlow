import { Input } from "@/components/ui/input";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function PhoneInput({ value, onChange }: PhoneInputProps) {
  const formatPhoneNumber = (input: string) => {
    // Remove all non-digits
    const digits = input.replace(/\D/g, '');
    
    // Limit to 11 digits (Brazilian phone format)
    const limitedDigits = digits.slice(0, 11);
    
    // Apply mask: (11) 99999-9999 or (11) 9999-9999
    if (limitedDigits.length <= 11) {
      // For 11 digits (with 9-digit cell phone): (11) 99999-9999
      if (limitedDigits.length > 7) {
        return `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2, 7)}-${limitedDigits.slice(7, 11)}`;
      }
      // For 6-7 digits: (11) 9999-999
      if (limitedDigits.length > 6) {
        return `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2, 6)}-${limitedDigits.slice(6, 11)}`;
      }
      // For 3-6 digits: (11) 9999
      if (limitedDigits.length > 2) {
        return `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2)}`;
      }
      // For 1-2 digits: (11
      if (limitedDigits.length > 0) {
        return `(${limitedDigits}`;
      }
    }
    
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    onChange(formatted);
  };

  return (
    <Input
      type="tel"
      placeholder="(11) 99999-9999"
      value={value}
      onChange={handleChange}
      maxLength={15}
      className="mt-1 border-gray-200 focus:border-pink-400 focus:ring-pink-400"
      data-testid="input-client-phone"
    />
  );
}