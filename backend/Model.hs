{-# LANGUAGE DeriveGeneric #-}

module Model where

import GHC.Generics
import Data.Aeson

data Species = Species
  { name :: String
  , population :: Double
  } deriving (Show, Generic)

instance FromJSON Species
instance ToJSON Species

data Interaction = Interaction
  { predator :: String
  , prey :: String
  , rate :: Double
  } deriving (Show, Generic)

instance FromJSON Interaction
instance ToJSON Interaction

data FoodWeb = FoodWeb
  { speciesList :: [Species]
  , interactions :: [Interaction]
  } deriving (Show, Generic)

instance FromJSON FoodWeb
instance ToJSON FoodWeb
