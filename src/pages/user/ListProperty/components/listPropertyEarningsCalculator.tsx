import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { DollarSign, TrendingUp } from "lucide-react";

const EarningsCalculator = () => {
  const [capacity, setCapacity] = useState([10]);
  const [pricePerNight, setPricePerNight] = useState([45]);
  const [occupancyRate, setOccupancyRate] = useState([70]);

  const monthlyEarnings = Math.round(
    capacity[0] * pricePerNight[0] * (occupancyRate[0] / 100) * 30
  );

  return (
    <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-secondary rounded-2xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
          <TrendingUp className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-foreground">Earnings Potential</h3>
          <p className="text-sm text-muted-foreground">Estimate your monthly revenue</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted-foreground">Pet Capacity</span>
            <span className="text-sm font-medium text-foreground">{capacity[0]} pets</span>
          </div>
          <Slider
            value={capacity}
            onValueChange={setCapacity}
            max={50}
            min={1}
            step={1}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted-foreground">Price per Night</span>
            <span className="text-sm font-medium text-foreground">${pricePerNight[0]}</span>
          </div>
          <Slider
            value={pricePerNight}
            onValueChange={setPricePerNight}
            max={150}
            min={15}
            step={5}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted-foreground">Occupancy Rate</span>
            <span className="text-sm font-medium text-foreground">{occupancyRate[0]}%</span>
          </div>
          <Slider
            value={occupancyRate}
            onValueChange={setOccupancyRate}
            max={100}
            min={20}
            step={5}
            className="w-full"
          />
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Estimated Monthly Earnings</span>
            <div className="flex items-center gap-1">
              <DollarSign className="h-6 w-6 text-success" />
              <span className="text-3xl font-bold text-success">
                {monthlyEarnings.toLocaleString()}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            *This is an estimate. Actual earnings may vary based on location and demand.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EarningsCalculator;
