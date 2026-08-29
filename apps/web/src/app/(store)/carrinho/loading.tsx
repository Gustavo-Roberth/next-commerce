import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart } from 'lucide-react';

const SKELETON_KEYS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5', 'sk-6', 'sk-7', 'sk-8'];

export default function CarrinhoLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-5 w-80" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {SKELETON_KEYS.slice(0, 3).map((key) => (
                <div key={key} className="flex gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-24 w-24 flex-shrink-0 rounded-md" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                  <Skeleton className="h-5 w-5" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <Skeleton className="h-6 w-40" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {SKELETON_KEYS.slice(0, 6).map((key) => (
                <div key={key} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
