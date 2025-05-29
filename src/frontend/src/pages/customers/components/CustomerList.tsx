import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';
import { Spinner } from '../../../components/ui/Spinner';
import { Select } from '../../../components/ui/Select';
import { bankApi } from '../../../services/api/bank.api';
import { getCustomerInitials, getCustomerDisplayName } from '../../../utils/customer.utils';

interface CustomerListProps {
  onCustomerSelect?: (cif: string) => void;
}

const CustomerList: React.FC<CustomerListProps> = ({ onCustomerSelect }) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  
  // Search form state
  const [searchParams, setSearchParams] = useState({
    cif: '',
    name: '',
    nationalId: '',
    companyName: '',
    registrationNumber: '',
    segment: '',
    status: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if at least one search parameter is provided
    const hasSearchParam = Object.values(searchParams).some(param => param.trim() !== '');
    
    if (!hasSearchParam) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Filter out empty parameters
      const params: any = {};
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value.trim()) {
          params[key] = value.trim();
        }
      });

      const response = await bankApi.searchCustomers(params);
      setCustomers(response.customers);
    } catch (err) {
      console.error('Error searching customers:', err);
      setError('Failed to search customers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAdvancedSearch = () => {
    setShowAdvancedSearch(prev => !prev);
  };

  // Helper function to get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    if (status.toLowerCase().includes('active')) return 'success';
    if (status.toLowerCase().includes('pending')) return 'warning';
    if (status.toLowerCase().includes('collection')) return 'danger';
    return 'neutral';
  };

  // Status badge variant is already defined below

  return (
    <Card>
      <CardHeader>
        <CardTitle>Find Customer</CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSearch} className="mb-4 space-y-4">
          <div className="flex">
            <Input
              placeholder="Search customers by CIF..."
              className="flex-1 rounded-r-none"
              name="cif"
              value={searchParams.cif}
              onChange={handleInputChange}
            />
            <Button type="submit" className="rounded-l-none">
              <i className="bi bi-search mr-2"></i>
              Search
            </Button>
          </div>
          
          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={toggleAdvancedSearch}
            >
              {showAdvancedSearch ? 'Hide' : 'Show'} Advanced Search
            </Button>
          </div>
          
          {showAdvancedSearch && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-neutral-50 rounded-md">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
                <Input
                  placeholder="Customer Name"
                  name="name"
                  value={searchParams.name}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">National ID</label>
                <Input
                  placeholder="National ID"
                  name="nationalId"
                  value={searchParams.nationalId}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Company Name</label>
                <Input
                  placeholder="Company Name"
                  name="companyName"
                  value={searchParams.companyName}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Registration Number</label>
                <Input
                  placeholder="Registration Number"
                  name="registrationNumber"
                  value={searchParams.registrationNumber}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Segment</label>
                <Select
                  name="segment"
                  value={searchParams.segment}
                  onChange={handleInputChange}
                  options={[
                    { value: "", label: "All Segments" },
                    { value: "RETAIL", label: "Retail" },
                    { value: "SME", label: "SME" },
                    { value: "CORPORATE", label: "Corporate" },
                    { value: "PREMIUM", label: "Premium" }
                  ]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
                <Select
                  name="status"
                  value={searchParams.status}
                  onChange={handleInputChange}
                  options={[
                    { value: "", label: "All Statuses" },
                    { value: "ACTIVE", label: "Active" },
                    { value: "PENDING", label: "Pending" },
                    { value: "COLLECTION", label: "Collection" },
                    { value: "CLOSED", label: "Closed" }
                  ]}
                />
              </div>
            </div>
          )}
        </form>
        
        {loading && (
          <div className="flex justify-center my-4">
            <Spinner size="md" />
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4">
            <p>{error}</p>
          </div>
        )}
        
        {customers.length > 0 && (
          <div className="overflow-x-auto mt-4">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 font-medium text-neutral-900">CIF</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-900">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-900">Segment</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, index) => (
                  <tr key={index} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="py-3 px-4">{customer.cif}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <Avatar
                          initials={getCustomerInitials(customer.name, customer.companyName)}
                          size="sm"
                          className="mr-3"
                        />
                        {getCustomerDisplayName(customer)}
                      </div>
                    </td>
                    <td className="py-3 px-4">{customer.segment}</td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatusBadgeVariant(customer.status)}>
                        {customer.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Link to={`/customers/${customer.cif}`}>
                          <Button size="sm" variant="primary" onClick={() => onCustomerSelect?.(customer.cif)}>
                            View
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && Object.values(searchParams).some(param => param.trim() !== '') && customers.length === 0 && (
          <div className="text-center py-8 text-neutral-500">
            <p>No customers found matching your search criteria</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerList;