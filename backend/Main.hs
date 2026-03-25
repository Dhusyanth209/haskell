{-# LANGUAGE OverloadedStrings #-}

import Web.Scotty
import Network.Wai.Middleware.Cors
import Data.Aeson (object, (.=))
import Model
import Simulation
import Analysis

main :: IO ()
main = scotty 3000 $ do
  -- Enable CORS so the React frontend can talk to the backend
  middleware simpleCors

  post "/simulate" $ do
    web <- jsonData
    let result = simulate web 20
    let stability = stabilityIndex result
    let keystone = findKeystone web

    json $ object
      [ "result" .= result
      , "stability" .= stability
      , "keystone" .= keystone
      ]
