import { useState, useEffect } from 'react';
import { bankApi, PhoneType, AddressType } from '../../../services/api/bank.api';

export const usePhoneTypes = () => {
  const [phoneTypes, setPhoneTypes] = useState<PhoneType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPhoneTypes = async () => {
      setLoading(true);
      setError(null);
      try {
        const types = await bankApi.getPhoneTypes();
        setPhoneTypes(types);
      } catch (err) {
        console.error('Error fetching phone types:', err);
        setError('Failed to load phone types');
        // Fallback to basic phone types
        setPhoneTypes([
          { value: 'mobile1', label: 'Mobile Phone 1' },
          { value: 'home1', label: 'Home Phone 1' },
          { value: 'work1', label: 'Work Phone 1' },
          { value: 'other1', label: 'Other Phone 1' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPhoneTypes();
  }, []);

  return { phoneTypes, loading, error };
};

export const useAddressTypes = () => {
  const [addressTypes, setAddressTypes] = useState<AddressType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAddressTypes = async () => {
      setLoading(true);
      setError(null);
      try {
        const types = await bankApi.getAddressTypes();
        setAddressTypes(types);
      } catch (err) {
        console.error('Error fetching address types:', err);
        setError('Failed to load address types');
        // Fallback to basic address types
        setAddressTypes([
          { value: 'home1', label: 'Home Address 1' },
          { value: 'work1', label: 'Work Address 1' },
          { value: 'mailing1', label: 'Mailing Address 1' },
          { value: 'other1', label: 'Other Address 1' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAddressTypes();
  }, []);

  return { addressTypes, loading, error };
};