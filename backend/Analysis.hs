module Analysis where

import Model
import Simulation
import Data.List (minimumBy)
import Data.Ord (comparing)

removeSpecies :: String -> FoodWeb -> FoodWeb
removeSpecies spName web =
  web { speciesList = filter (\s -> name s /= spName) (speciesList web)
      , interactions = filter (\i -> predator i /= spName && prey i /= spName) (interactions web)
      }

survivingSpecies :: FoodWeb -> Int
survivingSpecies web =
  length (filter (\s -> population s > 0.1) (speciesList web))

stabilityIndex :: FoodWeb -> Double
stabilityIndex web =
  let total = length (speciesList web)
      alive = survivingSpecies web
  in if total == 0 then 0 else fromIntegral alive / fromIntegral total

-- Keystone Species Detection
-- Finds the species whose removal causes the lowest final stability
findKeystone :: FoodWeb -> String
findKeystone web =
  let speciesNames = map name (speciesList web)
      results = [ (sp, stabilityIndex (simulate (removeSpecies sp web) 20))
                | sp <- speciesNames
                ]
  in if null results then "None" 
     else fst (minimumBy (comparing snd) results)
