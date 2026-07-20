import React, { useState, useMemo } from 'react';
import type { Vendor } from '../types.js';
import { Modal } from '../components/shared/Modal.js';
import { 
  ModalInput, 
  ModalSelect,
  ModalTextarea,
  ModalButton, 
  ModalLabel, 
  ModalSection, 
  ModalSectionHeader,
  ModalField 
} from '../components/shared/ModalElements.js';

interface VendorManagementViewProps {
  vendors: Vendor[];
  addVendor: (vendor: Omit<Vendor, 'id' | 'createdDate'>) => void;
  updateVendor: (vendorId: string, vendor: Partial<Vendor>) => void;
}

type SortableKeys = keyof Vendor;
type SortConfig = { key: SortableKeys; direction: 'ascending' | 'descending' };

const getStatusColor = (status: Vendor['status']) => {
  switch (status) {
    case 'Active': return 'bg-sov-green/20 text-sov-green';
    case 'Inactive': return 'bg-gray-500/20 text-gray-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
};

// NEW: Compliance colors
const getRiskColor = (risk?: string) => {
  switch (risk) {
    case 'Low': return 'bg-sov-green/20 text-sov-green';
    case 'Medium': return 'bg-sov-gold/20 text-sov-gold';
    case 'High': return 'bg-sov-red/20 text-sov-red';
    default: return 'bg-gray-500/20 text-gray-400';
  }
};

const getW9Color = (status?: string) => {
  switch (status) {
    case 'Received': return 'bg-sov-green/20 text-sov-green';
    case 'Pending': return 'bg-sov-gold/20 text-sov-gold';
    case 'Expired': return 'bg-sov-red/20 text-sov-red';
    default: return 'bg-gray-500/20 text-gray-400';
  }
};

const getCategoryColor = (category: Vendor['category']) => {
  switch (category) {
    case 'Software': return 'bg-blue-500/20 text-blue-400';
    case 'Hardware': return 'bg-orange-500/20 text-orange-400';
    case 'Services': return 'bg-purple-500/20 text-purple-400';
    case 'Supplies': return 'bg-green-500/20 text-green-400';
    case 'Professional': return 'bg-yellow-500/20 text-yellow-400';
    case 'Other': return 'bg-gray-500/20 text-gray-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
};

const SortIndicator: React.FC<{ direction?: 'ascending' | 'descending' }> = ({ direction }) => (
  <span className="inline-flex flex-col text-xs ml-2 opacity-50">
    <svg className={`h-2 w-2 ${direction === 'ascending' ? 'text-sov-light opacity-100' : 'text-sov-light-alt'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 3l-5 5h10l-5-5z"/></svg>
    <svg className={`h-2 w-2 ${direction === 'descending' ? 'text-sov-light opacity-100' : 'text-sov-light-alt'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 17l5-5H5l5 5z"/></svg>
  </span>
);

export const VendorManagementView: React.FC<VendorManagementViewProps> = ({ vendors, addVendor, updateVendor }) => {
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isNewVendorModalOpen, setIsNewVendorModalOpen] = useState(false);
  const [isEditVendorModalOpen, setIsEditVendorModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'name', direction: 'ascending' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Form state
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankRoutingNumber, setBankRoutingNumber] = useState('');
  const [taxId, setTaxId] = useState('');
  const [status, setStatus] = useState<Vendor['status']>('Active');
  const [category, setCategory] = useState<Vendor['category']>('Other');
  const [notes, setNotes] = useState('');
  
  // NEW: Compliance fields
  const [taxClassification, setTaxClassification] = useState<'Individual' | 'C-Corp' | 'S-Corp' | 'LLC' | 'Partnership' | 'Trust'>('Individual');
  const [w9Status, setW9Status] = useState<'Pending' | 'Received' | 'Expired'>('Pending');
  const [riskRating, setRiskRating] = useState<'Low' | 'Medium' | 'High'>('Low');
  const [paymentTermsDays, setPaymentTermsDays] = useState<number>(30);

  const filteredAndSortedVendors = useMemo(() => {
    let filtered = vendors.filter(vendor => {
      const matchesSearch = searchTerm === '' || 
        vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.taxId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === '' || vendor.category === filterCategory;
      const matchesStatus = filterStatus === '' || vendor.status === filterStatus;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filtered;
  }, [vendors, sortConfig, searchTerm, filterCategory, filterStatus]);

  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortDirection = (key: SortableKeys) => {
    if (!sortConfig || sortConfig.key !== key) return undefined;
    return sortConfig.direction;
  };

  const resetForm = () => {
    setName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setAddress('');
    setPaymentTerms('Net 30');
    setBankAccountNumber('');
    setBankRoutingNumber('');
    setTaxId('');
    setStatus('Active');
    setCategory('Other');
    setNotes('');
  };

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contactPerson || !email || !taxId) return;
    
    addVendor({
      name,
      contactPerson,
      email,
      phone,
      address,
      paymentTerms,
      bankAccountNumber: bankAccountNumber || undefined,
      bankRoutingNumber: bankRoutingNumber || undefined,
      taxId,
      status,
      category,
      notes: notes || undefined,
      // NEW compliance fields
      taxClassification,
      w9Status,
      riskRating,
      paymentTermsDays,
    });
    
    setIsNewVendorModalOpen(false);
    resetForm();
  };

  const handleEditVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setName(vendor.name);
    setContactPerson(vendor.contactPerson);
    setEmail(vendor.email);
    setPhone(vendor.phone);
    setAddress(vendor.address);
    setPaymentTerms(vendor.paymentTerms);
    setBankAccountNumber(vendor.bankAccountNumber || '');
    setBankRoutingNumber(vendor.bankRoutingNumber || '');
    setTaxId(vendor.taxId);
    setStatus(vendor.status);
    setCategory(vendor.category);
    setNotes(vendor.notes || '');
    setIsEditVendorModalOpen(true);
  };

  const handleUpdateVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor || !name || !contactPerson || !email || !taxId) return;
    
    updateVendor(selectedVendor.id, {
      name,
      contactPerson,
      email,
      phone,
      address,
      paymentTerms,
      bankAccountNumber: bankAccountNumber || undefined,
      bankRoutingNumber: bankRoutingNumber || undefined,
      taxId,
      status,
      category,
      notes: notes || undefined,
    });
    
    setIsEditVendorModalOpen(false);
    setSelectedVendor(null);
    resetForm();
  };

  const handleDeactivateVendor = (vendor: Vendor) => {
    updateVendor(vendor.id, { status: 'Inactive' });
  };

  const handleActivateVendor = (vendor: Vendor) => {
    updateVendor(vendor.id, { status: 'Active' });
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-sov-light-alt mb-2">Search Vendors</label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name, contact, email, or tax ID..."
              className="w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent"
            />
          </div>
          <div>
            <label htmlFor="categoryFilter" className="block text-sm font-medium text-sov-light-alt mb-2">Filter by Category</label>
            <select
              id="categoryFilter"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent"
            >
              <option value="">All Categories</option>
              <option value="Software">Software</option>
              <option value="Hardware">Hardware</option>
              <option value="Services">Services</option>
              <option value="Supplies">Supplies</option>
              <option value="Professional">Professional</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-sov-light-alt mb-2">Filter by Status</label>
            <select
              id="statusFilter"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setIsNewVendorModalOpen(true)}
              className="w-full bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors"
            >
              Add New Vendor
            </button>
          </div>
        </div>
      </div>

      {/* Vendor List */}
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700 max-h-[600px] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-sov-light">
            Vendor Registry ({filteredAndSortedVendors.length} vendors)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('name')}>
                  <div className="flex items-center">Vendor Name <SortIndicator direction={getSortDirection('name')} /></div>
                </th>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('category')}>
                  <div className="flex items-center">Category <SortIndicator direction={getSortDirection('category')} /></div>
                </th>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('contactPerson')}>
                  <div className="flex items-center">Contact <SortIndicator direction={getSortDirection('contactPerson')} /></div>
                </th>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('paymentTerms')}>
                  <div className="flex items-center">Payment Terms <SortIndicator direction={getSortDirection('paymentTerms')} /></div>
                </th>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('status')}>
                  <div className="flex items-center">Status <SortIndicator direction={getSortDirection('status')} /></div>
                </th>
                {/* NEW: Compliance Columns */}
                <th className="p-3 text-center">Risk</th>
                <th className="p-3 text-center">W-9</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedVendors.map(vendor => (
                <tr key={vendor.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="p-3">
                    <div>
                      <div className="font-semibold text-sov-light">{vendor.name}</div>
                      <div className="text-sm text-sov-light-alt">{vendor.email}</div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(vendor.category)}`}>
                      {vendor.category}
                    </span>
                  </td>
                  <td className="p-3">
                    <div>
                      <div className="text-sov-light">{vendor.contactPerson}</div>
                      <div className="text-sm text-sov-light-alt">{vendor.phone}</div>
                    </div>
                  </td>
                  <td className="p-3 text-sov-light">{vendor.paymentTerms}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vendor.status)}`}>
                      {vendor.status}
                    </span>
                  </td>
                  {/* NEW: Compliance columns */}
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(vendor.riskRating)}`}>
                      {vendor.riskRating || 'N/A'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getW9Color(vendor.w9Status)}`}>
                      {vendor.w9Status || 'Pending'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => setSelectedVendor(vendor)}
                        className="bg-sov-accent/20 text-sov-accent text-xs font-bold py-1 px-3 rounded-lg hover:bg-sov-accent/30 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEditVendor(vendor)}
                        className="bg-blue-500/20 text-blue-400 text-xs font-bold py-1 px-3 rounded-lg hover:bg-blue-500/30 transition-colors"
                      >
                        Edit
                      </button>
                      {vendor.status === 'Active' ? (
                        <button
                          onClick={() => handleDeactivateVendor(vendor)}
                          className="bg-sov-red/20 text-sov-red text-xs font-bold py-1 px-3 rounded-lg hover:bg-sov-red/30 transition-colors"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivateVendor(vendor)}
                          className="bg-sov-green/20 text-sov-green text-xs font-bold py-1 px-3 rounded-lg hover:bg-sov-green/30 transition-colors"
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Vendor Modal */}
      <Modal 
        isOpen={!!selectedVendor && !isEditVendorModalOpen} 
        onClose={() => setSelectedVendor(null)} 
        title={`Vendor Details`}
        gradient="from-purple-500/20 to-purple-500/5"
      >
        {selectedVendor && (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
            {/* Header Card */}
            <ModalSection className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{selectedVendor.name}</h3>
                <div className="flex items-center space-x-2">
                   <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-lg border ${
                     selectedVendor.status === 'Active' ? 'bg-sov-green/20 text-sov-green border-sov-green/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                   }`}>
                     {selectedVendor.status}
                   </span>
                   <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-lg border bg-white/5 text-sov-light border-white/10`}>
                     {selectedVendor.category}
                   </span>
                </div>
              </div>
              <div className="text-right">
                <ModalField label="Vendor ID" value={<span className="font-mono">{selectedVendor.id}</span>} />
              </div>
            </ModalSection>

            <div className="grid grid-cols-2 gap-6">
              <ModalSection className="space-y-4">
                 <ModalSectionHeader>Contact Info</ModalSectionHeader>
                 <ModalField label="Contact Person" value={selectedVendor.contactPerson} />
                 <ModalField label="Email" value={<span className="break-all">{selectedVendor.email}</span>} />
                 <ModalField label="Phone" value={selectedVendor.phone} />
              </ModalSection>

              <ModalSection className="space-y-4">
                 <ModalSectionHeader>Financial Details</ModalSectionHeader>
                 <ModalField label="Tax ID" value={<span className="font-mono">{selectedVendor.taxId}</span>} />
                 <ModalField label="Payment Terms" value={selectedVendor.paymentTerms} />
                 {selectedVendor.bankAccountNumber && (
                   <div className="pt-2 border-t border-white/5">
                      <p className="text-[10px] text-sov-light-alt mb-1">Bank: <span className="font-mono text-sov-light">{selectedVendor.bankRoutingNumber}</span></p>
                      <p className="text-[10px] text-sov-light-alt">Acct: <span className="font-mono text-sov-light">****{selectedVendor.bankAccountNumber.slice(-4)}</span></p>
                   </div>
                 )}
              </ModalSection>
            </div>

            <ModalSection>
              <ModalSectionHeader>Address</ModalSectionHeader>
              <p className="text-sov-light">{selectedVendor.address}</p>
            </ModalSection>

            {selectedVendor.notes && (
              <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl">
                 <h4 className="text-xs font-bold text-yellow-500/80 uppercase tracking-wider mb-2">Notes</h4>
                 <p className="text-sov-light text-sm italic">"{selectedVendor.notes}"</p>
              </div>
            )}
            
            <div className="text-center">
               <p className="text-[10px] text-sov-light-alt/50 uppercase tracking-widest">Added on {selectedVendor.createdDate}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Vendor Modal */}
      <Modal 
        isOpen={isNewVendorModalOpen || isEditVendorModalOpen} 
        onClose={() => {
          setIsNewVendorModalOpen(false);
          setIsEditVendorModalOpen(false);
          setSelectedVendor(null);
          resetForm();
        }} 
        title={isEditVendorModalOpen ? 'Edit Vendor' : 'Add New Vendor'}
      >
        <form onSubmit={isEditVendorModalOpen ? handleUpdateVendor : handleAddVendor} className="space-y-6">
          <ModalSection>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <ModalLabel htmlFor="vendorName">Vendor Name *</ModalLabel>
              <ModalInput
                type="text"
                id="vendorName"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <ModalLabel htmlFor="contactPerson">Contact Person *</ModalLabel>
              <ModalInput
                type="text"
                id="contactPerson"
                value={contactPerson}
                onChange={e => setContactPerson(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <ModalLabel htmlFor="email">Email *</ModalLabel>
              <ModalInput
                type="email"
                id="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <ModalLabel htmlFor="phone">Phone</ModalLabel>
              <ModalInput
                type="tel"
                id="phone"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <ModalLabel htmlFor="address">Address</ModalLabel>
              <ModalInput
                type="text"
                id="address"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <ModalLabel htmlFor="paymentTerms">Payment Terms</ModalLabel>
              <ModalSelect
                id="paymentTerms"
                value={paymentTerms}
                onChange={e => setPaymentTerms(e.target.value)}
              >
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 60">Net 60</option>
                <option value="Net 90">Net 90</option>
              </ModalSelect>
            </div>
            <div className="space-y-2">
              <ModalLabel htmlFor="taxId">Tax ID *</ModalLabel>
              <ModalInput
                type="text"
                id="taxId"
                value={taxId}
                onChange={e => setTaxId(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <ModalLabel htmlFor="category">Category</ModalLabel>
              <ModalSelect
                id="category"
                value={category}
                onChange={e => setCategory(e.target.value as Vendor['category'])}
              >
                <option value="Software">Software</option>
                <option value="Hardware">Hardware</option>
                <option value="Services">Services</option>
                <option value="Supplies">Supplies</option>
                <option value="Professional">Professional</option>
                <option value="Other">Other</option>
              </ModalSelect>
            </div>
            <div className="space-y-2">
              <ModalLabel htmlFor="status">Status</ModalLabel>
              <ModalSelect
                id="status"
                value={status}
                onChange={e => setStatus(e.target.value as Vendor['status'])}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </ModalSelect>
            </div>
            <div className="space-y-2">
              <ModalLabel htmlFor="bankRoutingNumber">Bank Routing Number</ModalLabel>
              <ModalInput
                type="text"
                id="bankRoutingNumber"
                value={bankRoutingNumber}
                onChange={e => setBankRoutingNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <ModalLabel htmlFor="bankAccountNumber">Bank Account Number</ModalLabel>
              <ModalInput
                type="text"
                id="bankAccountNumber"
                value={bankAccountNumber}
                onChange={e => setBankAccountNumber(e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <ModalLabel htmlFor="notes">Notes</ModalLabel>
              <ModalTextarea
                id="notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          </ModalSection>
          <div className="flex justify-end pt-4 space-x-4">
            <ModalButton
              type="button"
              variant="secondary"
              onClick={() => {
                setIsNewVendorModalOpen(false);
                setIsEditVendorModalOpen(false);
                setSelectedVendor(null);
                resetForm();
              }}
            >
              Cancel
            </ModalButton>
            <ModalButton
              type="submit"
              variant="primary"
            >
              {isEditVendorModalOpen ? 'Update Vendor' : 'Add Vendor'}
            </ModalButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};