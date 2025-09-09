'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2, FileText } from 'lucide-react';
import ScrollableList from '@/app/components/ui/ScrollableList';
import Swal from 'sweetalert2'

interface Client {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  address: string;
}

interface Item {
  id: string;
  item_name: string;
  item_description: string;
  item_price: number;
  availability: string;
}

interface QuotationLineItem {
  item_id: string;
  quantity: number;
  rate: number;
  line_item_total: number;
  item_name?: string;
  item_description?: string;
}

interface QuotationFormData {
  client_id: string;
  title: string;
  quotation_number: string;
  issue_date: string;
  due_date: string;
  terms_and_conditions: string;
  discount: number;
  tax_rate: number;
  line_items: QuotationLineItem[];
}

interface Quotation {
  id: string;
  quotation_number: string;
  title: string;
  total_amount?: number;
  issue_date: string;
  created_at: string;
  client_id: string;
  clients?: {
    name: string;
    contact_person: string;
    email?: string;
    address?: string;
  };
  quotation_line_items?: QuotationLineItem[];
}

const QuotationPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  const [formData, setFormData] = useState<QuotationFormData>({
    client_id: '',
    title: '',
    quotation_number: '',
    issue_date: '',
    due_date: '',
    terms_and_conditions: `1. Work Order: Work order should be issued by the buyer.
2. Validity: Offer Valid up to 30 days from the date of submission.
3. Delivery Time: lead time is within 30-35 days from the date of getting work order.
4. Payment Clearance: As per buyer's rules.`,
    discount: 0,
    tax_rate: 0,
    line_items: [{ item_id: '', quantity: 1, rate: 0, line_item_total: 0 }]
  });

  // Fetch clients and items on component mount
  useEffect(() => {
    fetchClientsAndItems();
    fetchQuotations();
  }, []);

  const fetchClientsAndItems = async () => {
    try {
      const res = await fetch('/api/client_item_api');
      if (!res.ok) throw new Error('Failed to fetch clients and items');

      const { clients, items } = await res.json();

      console.log('Clients Response:', clients);
      console.log('Items Response:', items);

      if (clients) setClients(clients);
      if (items) setItems(items);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchQuotations = async () => {
    try {
      const res = await fetch("/api/get-quotation");
      if (!res.ok) throw new Error("Failed to fetch quotations");

      const { quotations } = await res.json();
      setQuotations(quotations);
    } catch (error) {
      console.error("Error fetching quotations:", error);
    }
  };

  const generateQuotationNumber = () => {
    const date = new Date();
    const currentDate = String(date.getDate()).padStart(2, '0')
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `QUO-${year}${month}${currentDate}-${random}`;
  };

  const handleItemSelect = (index: number, itemId: string) => {
    const selectedItem = items.find(item => item.id === itemId);
    if (selectedItem) {
      const updatedLineItems = [...formData.line_items];
      updatedLineItems[index] = {
        ...updatedLineItems[index],
        item_id: itemId,
        rate: selectedItem.item_price,
        line_item_total: updatedLineItems[index].quantity * selectedItem.item_price,
        item_name: selectedItem.item_name,
        item_description: selectedItem.item_description
      };
      setFormData({ ...formData, line_items: updatedLineItems });
    }
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const updatedLineItems = [...formData.line_items];
    updatedLineItems[index] = {
      ...updatedLineItems[index],
      quantity,
      line_item_total: quantity * updatedLineItems[index].rate
    };
    setFormData({ ...formData, line_items: updatedLineItems });
  };

  const handleRateChange = (index: number, rate: number) => {
    const updatedLineItems = [...formData.line_items];
    updatedLineItems[index] = {
      ...updatedLineItems[index],
      rate,
      line_item_total: updatedLineItems[index].quantity * rate
    };
    setFormData({ ...formData, line_items: updatedLineItems });
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      line_items: [...formData.line_items, { item_id: '', quantity: 1, rate: 0, line_item_total: 0 }]
    });
  };

  const removeLineItem = (index: number) => {
    const updatedLineItems = formData.line_items.filter((_, i) => i !== index);
    setFormData({ ...formData, line_items: updatedLineItems });
  };

  const calculateTotals = () => {
    const subtotal = formData.line_items.reduce((sum, item) => sum + item.line_item_total, 0);
    const discountAmount = (subtotal * formData.discount) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * formData.tax_rate) / 100;
    const total = taxableAmount + taxAmount;
    
    return { subtotal, discountAmount, taxAmount, total };
  };

  const openModal = () => {
    setFormData({
      ...formData,
      quotation_number: generateQuotationNumber(),
      issue_date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirmOpen(true);
  };

  const createQuotation = async () => {
    let userId: string | null = null;

    // Dynamically get the Supabase auth session
    const sessionKey = Object.keys(localStorage).find(key => key.includes('-auth-token'));

    if (!sessionKey) {
      console.error('No user session found in localStorage');
      return;
    }

    const sessionString = localStorage.getItem(sessionKey);
    if (!sessionString) {
      console.error('User session value not found');
      return;
    }

    const sessionObj = JSON.parse(sessionString);
    userId = sessionObj.user?.id;

    if (!userId) {
      console.error('User ID not found in session object');
      return;
    }

    console.log('Logged-in user ID:', userId);

    setLoading(true);
    try {
      const response = await fetch('/api/insert_quotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData, userId }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Failed to create quotation');
        return;
      }


      // Instead of alert
      Swal.fire({
        icon: 'success',
        title: 'Quotation created successfully!',
        showConfirmButton: false,
        timer: 2000 // auto close after 2 seconds
      });      // Reset form, close modal, refresh list
      setFormData({
        client_id: '',
        title: '',
        quotation_number: '',
        issue_date: '',
        due_date: '',
        terms_and_conditions: '',
        discount: 0,
        tax_rate: 0,
        line_items: [{ item_id: '', quantity: 1, rate: 0, line_item_total: 0 }]
      });
      setIsModalOpen(false);
      setIsConfirmOpen(false);
      fetchQuotations();

    } catch (error) {
      console.error('Error creating quotation:', error);
      alert('Error creating quotation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async (quotation: Quotation) => {
    try {
      const res = await fetch(`/api/export-quotation?id=${quotation.id}`);
      if (!res.ok) {
        throw new Error('Failed to generate PDF');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quotation-${quotation.quotation_number}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const { subtotal, discountAmount, taxAmount, total } = calculateTotals();
  const headers = ["Quotation No.", "Client", "Title", "Amount", "Date", "Actions"];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quotations</h1>
        <button
          onClick={openModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Generate Quotation
        </button>
      </div>

      <div className="flex gap-6">
        {/* Quotations List */}
        <div className="w-full">
          <ScrollableList headers={headers}>
            {quotations.map((quotation) => (
              <tr
                key={quotation.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedQuotation(quotation)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {quotation.quotation_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {quotation.clients?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {quotation.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ৳{quotation.total_amount?.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(quotation.issue_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    className="text-blue-600 hover:text-blue-900"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportPDF(quotation);
                    }}
                  >
                    <FileText size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </ScrollableList>
        </div>

        {/* Quotation Detail Modal */}
        {selectedQuotation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
              
              {/* Close Button */}
              <button
                onClick={() => setSelectedQuotation(null)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>

              {/* Quotation Header */}
              <h2 className="text-xl font-semibold mb-4">
                Quotation #{selectedQuotation.quotation_number}
              </h2>

              {/* Client Details */}
              <div className="mb-4">
                <h3 className="font-semibold">Client Details</h3>
                <p><strong>Name:</strong> {selectedQuotation.clients?.name}</p>
                <p><strong>Contact Person:</strong> {selectedQuotation.clients?.contact_person}</p>
                {selectedQuotation.clients?.email && <p><strong>Email:</strong> {selectedQuotation.clients.email}</p>}
                {selectedQuotation.clients?.address && <p><strong>Address:</strong> {selectedQuotation.clients.address}</p>}
              </div>

              {/* Quotation Info */}
              <div className="mb-4">
                <p><strong>Title:</strong> {selectedQuotation.title}</p>
                <p><strong>Issue Date:</strong> {new Date(selectedQuotation.issue_date).toLocaleDateString()}</p>
                <p><strong>Total Amount:</strong> ৳{selectedQuotation.total_amount?.toLocaleString()}</p>
              </div>

              {/* Quotation Line Items */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2">Quotation Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300 rounded-lg text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 border-b">SL</th>
                        <th className="px-4 py-2 border-b text-left">Item Name</th>
                        <th className="px-4 py-2 border-b text-left">Description</th>
                        <th className="px-4 py-2 border-b">Quantity</th>
                        <th className="px-4 py-2 border-b">Unit Price (৳)</th>
                        <th className="px-4 py-2 border-b">Total Price (৳)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedQuotation.quotation_line_items?.length ? (
                        selectedQuotation.quotation_line_items.map((item: QuotationLineItem, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-2 border-b text-center">{idx + 1}</td>
                            <td className="px-4 py-2 border-b">{item.item_name || item.item_id}</td>
                            <td className="px-4 py-2 border-b">{item.item_description || "-"}</td>
                            <td className="px-4 py-2 border-b text-center">{item.quantity}</td>
                            <td className="px-4 py-2 border-b text-right">{item.rate.toLocaleString()}</td>
                            <td className="px-4 py-2 border-b text-right">{item.line_item_total.toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-4 py-2 border-b text-center" colSpan={6}>
                            No items found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Export Button */}
              <button
                onClick={() => handleExportPDF(selectedQuotation)}
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Export as PDF
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Create New Quotation</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Client *</label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Quotation title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quotation Number</label>
                  <input
                    type="text"
                    value={formData.quotation_number}
                    onChange={(e) => setFormData({ ...formData, quotation_number: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Issue Date *</label>
                  <input
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Discount (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.tax_rate}
                      onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800">Items</h3>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                  >
                    <Plus size={16} />
                    Add Item
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.line_items.map((lineItem, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border border-gray-200 rounded-lg">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                        <select
                          value={lineItem.item_id}
                          onChange={(e) => handleItemSelect(index, e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="">Select Item</option>
                          {items.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.item_name} - ৳{item.item_price}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={lineItem.quantity}
                          onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rate</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={lineItem.rate}
                          onChange={(e) => handleRateChange(index, parseFloat(e.target.value) || 0)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                          <input
                            type="text"
                            value={`৳${lineItem.line_item_total.toFixed(2)}`}
                            readOnly
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                          />
                        </div>
                        {formData.line_items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLineItem(index)}
                            className="text-red-600 hover:text-red-800 p-2"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals Summary */}
                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>৳{subtotal.toFixed(2)}</span>
                    </div>
                    {formData.discount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Discount ({formData.discount}%):</span>
                        <span>-৳{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {formData.tax_rate > 0 && (
                      <div className="flex justify-between">
                        <span>Tax ({formData.tax_rate}%):</span>
                        <span>৳{taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>৳{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Terms & Conditions</label>
                <textarea
                  value={formData.terms_and_conditions}
                  onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
                  rows={6}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter terms and conditions"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm Creation</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to create this quotation? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={createQuotation}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationPage;