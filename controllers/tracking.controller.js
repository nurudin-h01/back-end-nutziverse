const { dataToken } = require("../helpers");
const { findIndexByDate, calculate_totalNutrition } = require("../helpers/tracking.helper");
const TrackingModel = require("../models/tracking.model");

const getTracking = async (req, res) => {
  const {data} = dataToken(req, res)
  const UID = data._id
  try {
    const tracking = await TrackingModel.findOne({userID: UID}).populate({
      path: 'tracking',
      populate: {
        path: 'makanan',
        populate: 'makananID'
      }
    })
    
    res.send(tracking)
  } catch (error) {
    res.status(500).send({error: error.message})
  }
}

const todayTracking = async (req, res) => {
  const {data} = dataToken(req, res)
  const UID = data._id

  let today = new Date()
  today = today.toISOString().split('T')[0]

  let todayTracking = null
  
  try {
    const tracking = await TrackingModel.findOne({userID: UID}).populate({
      path: 'tracking',
      populate: {
        path: 'makanan',
        populate: 'makananID'
      }
    })
    
    const todayTrackingIndex = findIndexByDate(tracking.tracking, today)
    
    if(todayTrackingIndex > -1) {
      todayTracking = tracking.tracking[todayTrackingIndex]
    }

    const {totKarbohidrat, totProtein, totLemak} = calculate_totalNutrition(todayTracking)
    
    const response = {
      _id: tracking._id,
      userID: tracking.userID,
      tracking: todayTracking,
      totKarbohidrat: totKarbohidrat,
      totProtein: totProtein,
      totLemak: totLemak,
      kendaraan: tracking.kendaraan
    }
    
    res.send(response)
  } catch (error) {
    res.status(500).send({error: error.message})
  }
}

const perDateTracking = async (req, res) => {
  const {data} = dataToken(req, res)
  const UID = data._id
  
  let {date} = req.body
  let dateTracking = null
  
  try {
    if(!date) {
      return res.status(400).send({message: "tolong pilih tanggal"})
    }

    const tracking = await TrackingModel.findOne({userID: UID}).populate({
      path: 'tracking',
      populate: {
        path: 'makanan',
        populate: 'makananID'
      }
    })
    
    const dateTrackingIndex = findIndexByDate(tracking.tracking, date)
    
    if(dateTrackingIndex > -1) {
      dateTracking = tracking.tracking[dateTrackingIndex]
    }

    const {totKarbohidrat, totProtein, totLemak} = calculate_totalNutrition(dateTracking)
    
    const response = {
      _id: tracking._id,
      userID: tracking.userID,
      tracking: dateTracking,
      totKarbohidrat: totKarbohidrat,
      totProtein: totProtein,
      totLemak: totLemak,
      kendaraan: tracking.kendaraan
    }
    
    res.send(response)
  } catch (error) {
    res.status(500).send({error: error.message})
  }

}

const addTracking = async (req, res) => {
  const {data} = dataToken(req, res)
  const UID = data._id
  const {makanan, totKalori, totKarbon} = req.body

  try {
    const trackingExist = await TrackingModel.findOne({userID: UID})

    if(trackingExist) {
      // cek if there's date now in makanan tanggal
      let today = new Date()
      // today = today.toISOString().split('T')[0]
      today = today.toLocaleDateString()
      console.log(today)
      const trackingIndex = trackingExist.tracking.findIndex(el => el.tanggal.toISOString().includes(today))

      // jika sudah terdapat history makanan di hari ini
      if(trackingIndex > -1) {
        makanan.map(item => trackingExist.tracking[trackingIndex].makanan.push(item))
        trackingExist.tracking[trackingIndex].totKalori += totKalori
        trackingExist.tracking[trackingIndex].totKarbon += totKarbon
        
        await trackingExist.save()
      } 
      // jika belum terdapat history makanan di hari ini
      else {
        const tracking = {
          tanggal: new Date().toLocaleDateString(),
          makanan: makanan,
          totKalori: totKalori,
          totKarbon: totKarbon
        }

        trackingExist.tracking.push(tracking)
        trackingExist.save()
      }

      res.send({message: 'success'})
    } else {
      const tracking = {
        tanggal: new Date().toLocaleDateString(),
        makanan: makanan,
        totKalori: totKalori,
        totKarbon: totKarbon
      }
      
      const newTracking = {
        userID: UID,
        tracking: [tracking],
        kendaraan: 10
      }

      const saved = new TrackingModel(newTracking)
      await saved.save()

      res.send({message: "Success"})
    }
  } catch (error) {
    res.status(500).send({error: error.message})
  }
}

module.exports = {
  getTracking,
  addTracking,
  todayTracking,
  perDateTracking
}