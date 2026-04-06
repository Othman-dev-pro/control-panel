-- Allow owners to delete orders for their customers (needed for customer deletion cleanup)
CREATE POLICY "Owners can delete their orders"
ON public.orders
FOR DELETE
USING (owner_id = auth.uid());