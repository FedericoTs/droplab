# Campaign Order System - Implementation Roadmap
## Fast Track to Production (4 Weeks)

**Last Updated**: October 23, 2025
**Goal**: Transform campaign management from 280 minutes/month to 10 minutes/month
**Impact**: $32,700/year value creation + 97% time savings

---

## Executive Summary

We have a **Performance Matrix** that makes intelligent recommendations. We need an **Order System** that executes those recommendations.

**Current Gap**: "Generate Order" button does nothing
**Solution**: Build complete order workflow in 4 weeks

---

## Week 1: Core Order Generation (MVP)

### Goal: Working end-to-end order flow

**Day 1-2: Database Schema**
```sql
-- File: lib/database/connection.ts (add to initializeDatabase)

CREATE TABLE campaign_orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  total_stores INTEGER NOT NULL,
  total_quantity INTEGER NOT NULL,
  estimated_cost REAL,
  pdf_url TEXT,
  csv_url TEXT
);

CREATE TABLE campaign_order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  store_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  recommended_quantity INTEGER NOT NULL,
  approved_quantity INTEGER NOT NULL,
  FOREIGN KEY (order_id) REFERENCES campaign_orders(id),
  FOREIGN KEY (store_id) REFERENCES retail_stores(id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);
```

**Day 3-4: API Endpoint**
```typescript
// File: app/api/campaigns/orders/generate/route.ts

export async function POST(request: Request) {
  const { approvals } = await request.json();

  // 1. Create order record
  const orderId = nanoid();
  const orderNumber = generateOrderNumber(); // ORD-2025-10-001

  // 2. Insert order items
  for (const approval of approvals) {
    insertOrderItem(orderId, approval);
  }

  // 3. Generate PDF
  const pdfUrl = await generateOrderPDF(orderId);

  // 4. Return success
  return NextResponse.json({
    success: true,
    data: { orderId, orderNumber, pdfUrl }
  });
}
```

**Day 5: PDF Generation**
```typescript
// File: lib/pdf/order-sheet.ts

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function generateOrderPDF(orderId: string): Promise<string> {
  const order = getOrderById(orderId);
  const items = getOrderItems(orderId);

  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text('Campaign Order', 20, 20);
  doc.setFontSize(12);
  doc.text(`Order #${order.order_number}`, 20, 30);

  // Table
  autoTable(doc, {
    head: [['Store #', 'Store Name', 'Campaign', 'Quantity']],
    body: items.map(item => [
      item.store_number,
      item.store_name,
      item.campaign_name,
      item.approved_quantity
    ]),
    startY: 40
  });

  // Save
  const filename = `order-${order.order_number}.pdf`;
  doc.save(`public/orders/${filename}`);

  return `/orders/${filename}`;
}
```

**Day 6-7: Frontend Integration**
```typescript
// File: app/campaigns/matrix/page.tsx (update existing)

const handleGenerateOrder = async () => {
  const approvals = data.stores
    .filter(s => s.status === 'auto-approve')
    .map(s => ({
      storeId: s.store_id,
      campaignId: s.top_recommendation.campaign_id,
      recommendedQuantity: s.top_recommendation.recommended_quantity,
      approvedQuantity: s.top_recommendation.recommended_quantity,
      status: 'approved'
    }));

  const response = await fetch('/api/campaigns/orders/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approvals })
  });

  const result = await response.json();

  if (result.success) {
    // Download PDF
    window.open(result.data.pdfUrl, '_blank');
    toast.success(`Order ${result.data.orderNumber} generated!`);
  }
};
```

**Week 1 Deliverables**:
- ✅ Database tables created
- ✅ API endpoint working
- ✅ PDF generation functional
- ✅ "Generate Order" button works
- ✅ Test with 10 stores

**Demo**: User clicks "Generate Order" → PDF downloads with all approved stores

---

## Week 2: UI Polish & Order History

### Goal: Professional user experience

**Day 8-9: Confirmation Modal**
```tsx
// File: components/campaigns/order-confirmation-modal.tsx

export function OrderConfirmationModal({ stores, onConfirm, onCancel }) {
  const totalQuantity = stores.reduce((sum, s) => sum + s.quantity, 0);
  const estimatedCost = totalQuantity * 0.25; // $0.25 per piece

  return (
    <Dialog>
      <DialogHeader>
        <DialogTitle>Confirm Order Generation</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Stores" value={stores.length} />
          <StatCard label="Quantity" value={totalQuantity} />
          <StatCard label="Est. Cost" value={`$${estimatedCost}`} />
        </div>

        <OrderBreakdown stores={stores} />
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onConfirm}>Generate Order</Button>
      </DialogFooter>
    </Dialog>
  );
}
```

**Day 10-11: Orders List Page**
```tsx
// File: app/campaigns/orders/page.tsx

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetch('/api/campaigns/orders')
      .then(res => res.json())
      .then(data => setOrders(data.orders));
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Campaign Orders</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Stores</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map(order => (
            <TableRow key={order.id}>
              <TableCell>{order.order_number}</TableCell>
              <TableCell>{formatDate(order.created_at)}</TableCell>
              <TableCell>{order.total_stores}</TableCell>
              <TableCell>{order.total_quantity}</TableCell>
              <TableCell>
                <Badge>{order.status}</Badge>
              </TableCell>
              <TableCell>
                <Button size="sm" onClick={() => downloadPDF(order.pdf_url)}>
                  Download PDF
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

**Day 12-13: Order Detail View**
```tsx
// File: app/campaigns/orders/[id]/page.tsx

export default function OrderDetailPage({ params }) {
  const order = useOrder(params.id);
  const items = useOrderItems(params.id);

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Order {order.order_number}</h1>
        <div className="flex gap-2">
          <Button onClick={() => downloadPDF(order.pdf_url)}>
            Download PDF
          </Button>
          <Button onClick={() => downloadCSV(order.csv_url)}>
            Download CSV
          </Button>
        </div>
      </div>

      <OrderSummaryCard order={order} />

      <OrderItemsTable items={items} />
    </div>
  );
}
```

**Day 14: CSV Export**
```typescript
// File: lib/csv/order-export.ts

export function generateOrderCSV(orderId: string): string {
  const items = getOrderItems(orderId);

  const csv = Papa.unparse({
    fields: ['Store Number', 'Store Name', 'Campaign', 'Quantity', 'Cost'],
    data: items.map(item => [
      item.store_number,
      item.store_name,
      item.campaign_name,
      item.approved_quantity,
      (item.approved_quantity * 0.25).toFixed(2)
    ])
  });

  const filename = `order-${order.order_number}.csv`;
  fs.writeFileSync(`public/orders/${filename}`, csv);

  return `/orders/${filename}`;
}
```

**Week 2 Deliverables**:
- ✅ Confirmation modal before generation
- ✅ Orders list page (/campaigns/orders)
- ✅ Order detail view
- ✅ CSV export
- ✅ Download buttons working

**Demo**: Complete order workflow with professional UI

---

## Week 3: Advanced Features

### Goal: Power user tools

**Day 15-16: Bulk Editing**
```tsx
// File: components/campaigns/bulk-edit-toolbar.tsx

export function BulkEditToolbar({ selectedStores, onApply }) {
  const [quantityAdjustment, setQuantityAdjustment] = useState(0);

  const handleApply = () => {
    const updates = selectedStores.map(store => ({
      ...store,
      quantity: store.quantity + quantityAdjustment
    }));
    onApply(updates);
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
      <span className="font-medium">{selectedStores.length} stores selected</span>

      <Input
        type="number"
        placeholder="Adjust quantity"
        value={quantityAdjustment}
        onChange={(e) => setQuantityAdjustment(parseInt(e.target.value))}
      />

      <Button onClick={handleApply}>Apply to Selected</Button>
    </div>
  );
}
```

**Day 17-18: Quantity Overrides**
```tsx
// File: components/campaigns/performance-matrix-grid.tsx (update)

// Add to each store card
<div className="flex items-center gap-2">
  <span className="text-sm text-slate-600">Recommended: {rec.recommended_quantity}</span>
  <Input
    type="number"
    value={overrides[store.store_id] || rec.recommended_quantity}
    onChange={(e) => handleOverride(store.store_id, parseInt(e.target.value))}
    className="w-24"
  />
</div>

{overrides[store.store_id] && (
  <Badge variant="outline" className="text-orange-600">
    Override: +{overrides[store.store_id] - rec.recommended_quantity}
  </Badge>
)}
```

**Day 19-20: Order Notes**
```tsx
// Add notes field to order items
<Textarea
  placeholder="Add notes for this store..."
  value={notes[store.store_id] || ''}
  onChange={(e) => setNotes({ ...notes, [store.store_id]: e.target.value })}
/>
```

**Day 21: Order Search/Filter**
```tsx
// File: app/campaigns/orders/page.tsx (enhance)

const [searchQuery, setSearchQuery] = useState('');
const [statusFilter, setStatusFilter] = useState('all');

const filteredOrders = orders.filter(order => {
  if (searchQuery && !order.order_number.includes(searchQuery)) return false;
  if (statusFilter !== 'all' && order.status !== statusFilter) return false;
  return true;
});
```

**Week 3 Deliverables**:
- ✅ Bulk select/edit stores
- ✅ Quantity overrides
- ✅ Order notes
- ✅ Search/filter orders
- ✅ Enhanced PDF with notes

**Demo**: Power user workflow with bulk editing

---

## Week 4: Integration & Automation

### Goal: End-to-end automation

**Day 22-23: Email Notifications**
```typescript
// File: lib/email/order-notifications.ts

export async function sendOrderNotification(orderId: string) {
  const order = getOrderById(orderId);

  await sendEmail({
    to: 'supplier@printco.com',
    subject: `New Campaign Order: ${order.order_number}`,
    body: `
      New order ready for printing:

      Order #: ${order.order_number}
      Stores: ${order.total_stores}
      Quantity: ${order.total_quantity}

      Download PDF: ${process.env.NEXT_PUBLIC_APP_URL}${order.pdf_url}
    `
  });
}
```

**Day 24-25: Order Status Tracking**
```typescript
// Add status updates
enum OrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  SENT = 'sent',
  PRINTING = 'printing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered'
}

// API endpoint
POST /api/campaigns/orders/[id]/status
{
  status: 'printing',
  tracking_number: '1Z999AA1...'
}
```

**Day 26: Performance Metrics**
```tsx
// File: app/campaigns/orders/analytics/page.tsx

export default function OrderAnalyticsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Order Analytics</h1>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total Orders" value={orderCount} />
        <MetricCard label="Total Spend" value={`$${totalSpend}`} />
        <MetricCard label="Avg Order Size" value={avgOrderSize} />
        <MetricCard label="Orders This Month" value={monthlyOrders} />
      </div>

      <OrderTrendChart data={orderHistory} />
    </div>
  );
}
```

**Day 27-28: Testing & Polish**
- End-to-end testing
- Error handling
- Loading states
- Edge cases
- Documentation

**Week 4 Deliverables**:
- ✅ Email notifications
- ✅ Status tracking
- ✅ Analytics dashboard
- ✅ Complete testing
- ✅ Production ready

---

## Success Criteria

**Functional Requirements**:
- [ ] Generate order PDF in <10 seconds
- [ ] Support 400+ stores
- [ ] Accurate cost calculations
- [ ] Email notifications working
- [ ] CSV export functional
- [ ] Order history persisted
- [ ] Search/filter working
- [ ] Bulk operations supported

**Non-Functional Requirements**:
- [ ] Zero errors in PDF generation
- [ ] 99.9% uptime
- [ ] <3 second page load
- [ ] Mobile responsive
- [ ] Accessible (WCAG AA)
- [ ] Secure (no data leaks)

**User Experience**:
- [ ] Total time: <10 minutes (vs 280 minutes)
- [ ] Fewer than 3 clicks to generate order
- [ ] Clear error messages
- [ ] Confirmation before actions
- [ ] Professional PDF output

---

## Files to Create/Modify

### New Files (23 files)
```
lib/
  database/
    order-queries.ts
  pdf/
    order-sheet.ts
  csv/
    order-export.ts
  email/
    order-notifications.ts

app/
  api/
    campaigns/
      orders/
        generate/route.ts
        route.ts
        [id]/route.ts
        [id]/status/route.ts
  campaigns/
    orders/
      page.tsx
      [id]/page.tsx
      analytics/page.tsx

components/
  campaigns/
    order-confirmation-modal.tsx
    order-success.tsx
    order-list.tsx
    order-detail.tsx
    order-items-table.tsx
    bulk-edit-toolbar.tsx
    quantity-override-input.tsx
```

### Modified Files (2 files)
```
lib/database/connection.ts        # Add new tables
app/campaigns/matrix/page.tsx     # Wire up Generate Order button
```

---

## Risk Mitigation

**Risk 1: PDF generation fails**
- Mitigation: Fallback to CSV export
- Test: Generate 1000-store order

**Risk 2: Database performance**
- Mitigation: Add indexes on order tables
- Test: Query 10,000 orders

**Risk 3: User confusion**
- Mitigation: Add tooltips and help text
- Test: User testing with non-technical manager

**Risk 4: Cost overruns**
- Mitigation: Show cost preview before generation
- Test: Validate cost calculations

---

## Rollout Plan

**Phase 1: Internal Testing (Week 1-2)**
- Dev team only
- Test with sample data
- Fix critical bugs

**Phase 2: Beta Testing (Week 3)**
- 1-2 friendly users
- Real campaigns
- Gather feedback

**Phase 3: Limited Release (Week 4)**
- 10 users
- Monitor for issues
- Iterate quickly

**Phase 4: Full Production (Week 5+)**
- All users
- Monitor metrics
- Continuous improvement

---

## Metrics to Track

**Adoption**:
- Orders generated per month
- Users creating orders
- PDF downloads
- CSV exports

**Performance**:
- Average order generation time
- PDF generation success rate
- Error rate
- Page load time

**Business Impact**:
- Time saved per order
- Error rate reduction
- User satisfaction (NPS)
- ROI (savings + revenue gain)

---

## Next Steps

1. **Get Approval**: Review this roadmap with stakeholders
2. **Assign Resources**: 1 full-stack engineer for 4 weeks
3. **Create Tickets**: Break down into Jira/Linear tasks
4. **Start Development**: Begin Week 1 on Monday
5. **Daily Standups**: Track progress, unblock issues
6. **Weekly Demos**: Show progress to stakeholders

---

## Questions?

Contact the development team or see:
- Full analysis: `CAMPAIGN_ORDER_REVOLUTION.md`
- Current system: `CURRENT_STATE.md`
- Technical docs: `CLAUDE.md`

**Let's ship this!** 🚀
