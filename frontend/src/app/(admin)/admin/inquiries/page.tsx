export default function AdminInquiriesPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Inquiries</h1>
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2023-10-25</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Alice Smith</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Custom Engagement Ring</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
