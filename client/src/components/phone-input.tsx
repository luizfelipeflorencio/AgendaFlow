import { Input } from "@/components/ui/input";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function PhoneInput({ value, onChange }: PhoneInputProps) {
  const formatPhoneNumber = (input: string) => {
    // Remove all non-digits
    const digits = input.replace(/\D/g, '');
    
    // Apply mask: (11) 99999-9999
    if (digits.length <= 11) {
      let formatted = digits;
      
      if (digits.length > 2) {
        formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
      }
      
      if (digits.length > 7) {
        formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
      }
      
      return formatted;
    }
    
    return value; // Return current value if too long
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
