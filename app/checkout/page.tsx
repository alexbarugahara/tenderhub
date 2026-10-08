import { Suspense } from "react";

import CheckoutPageContent from "@/components/checkout/CheckoutPageContent";

export default function CheckoutPage() {
return (
<Suspense
fallback={ <main className="min-h-screen bg-tenderhub-background px-4 py-10 sm:px-6 lg:px-8"> <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center"> <div className="text-center"> <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-tenderhub-navy text-xl font-bold text-white">
TH </div>


          <p className="text-sm text-gray-600">
            Loading checkout...
          </p>
        </div>
      </div>
    </main>
  }
>
  <CheckoutPageContent />
</Suspense>


);
}
