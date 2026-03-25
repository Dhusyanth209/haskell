module Simulation where

import Model
import Data.List (find)

-- Lotka-Volterra constant
growthRate :: Double
growthRate = 0.1

-- Update a single species population based on Lotka-Volterra logic
-- dN/dt = rN - (sum over predators) InteractionRate * PredatorPopulation * N
updateSpecies :: FoodWeb -> Species -> Species
updateSpecies web sp =
  let n = population sp
      
      -- Growth term: r * N
      growth = growthRate * n
      
      -- Loss term (Predation): InteractionRate * PredatorPopulation * N
      predLoss = sum [ rate i * n * getPop (predator i) (speciesList web)
                     | i <- interactions web
                     , prey i == name sp
                     ]
      
      -- Gain term (Eating): InteractionRate * N * PreyPopulation
      preyGain = sum [ rate i * n * getPop (prey i) (speciesList web)
                     | i <- interactions web
                     , predator i == name sp
                     ]
                     
  in sp { population = max 0 (n + growth - predLoss + preyGain) }

getPop :: String -> [Species] -> Double
getPop n sps = case find (\s -> name s == n) sps of
  Just s -> population s
  Nothing -> 0

simulateStep :: FoodWeb -> FoodWeb
simulateStep web =
  web { speciesList = map (updateSpecies web) (speciesList web) }

simulate :: FoodWeb -> Int -> FoodWeb
simulate web 0 = web
simulate web n = simulate (simulateStep web) (n - 1)
