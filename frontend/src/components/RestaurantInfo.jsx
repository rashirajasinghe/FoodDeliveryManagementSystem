import React from 'react';
import { Star, Clock, MapPin, Phone, Mail, DollarSign } from 'lucide-react';

const RestaurantInfo = ({ restaurant }) => {
  const formatRating = (rating) => {
    return rating ? rating.toFixed(1) : 'N/A';
  };

  const formatDeliveryTime = (time) => {
    return `${time || 30} min`;
  };

  const formatDeliveryFee = (fee) => {
    return fee === 0 ? 'Free' : `$${fee.toFixed(2)}`;
  };

  const formatOperatingHours = (hours) => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    return days.map((day, index) => {
      const dayHours = hours[day];
      if (dayHours.closed) {
        return { day: dayNames[index], hours: 'Closed' };
      }
      return { day: dayNames[index], hours: `${dayHours.open} - ${dayHours.close}` };
    });
  };

  const operatingHours = formatOperatingHours(restaurant.operatingHours);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Restaurant Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {restaurant.name}
        </h1>
        
        <p className="text-gray-600 mb-4">
          {restaurant.description}
        </p>

        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center space-x-1">
            <Star className="h-5 w-5 text-yellow-400 fill-current" />
            <span className="font-semibold text-gray-900">
              {formatRating(restaurant.rating.average)}
            </span>
            <span className="text-gray-500">
              ({restaurant.rating.count} reviews)
            </span>
          </div>
          
          <span className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-700">
            {restaurant.cuisine}
          </span>
        </div>

        {/* Features */}
        {restaurant.features && restaurant.features.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {restaurant.features.map((feature, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium"
              >
                {feature.replace('_', ' ')}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Restaurant Details */}
      <div className="space-y-4">
        {/* Delivery Info */}
        <div className="flex items-center space-x-2 text-gray-600">
          <Clock className="h-5 w-5" />
          <span>Delivery: {formatDeliveryTime(restaurant.estimatedDeliveryTime)}</span>
        </div>

        <div className="flex items-center space-x-2 text-gray-600">
          <DollarSign className="h-5 w-5" />
          <span>Delivery Fee: {formatDeliveryFee(restaurant.deliveryFee)}</span>
        </div>

        {restaurant.minimumOrder > 0 && (
          <div className="text-gray-600">
            <span className="font-medium">Minimum Order: </span>
            <span>${restaurant.minimumOrder.toFixed(2)}</span>
          </div>
        )}

        {/* Address */}
        <div className="flex items-start space-x-2 text-gray-600">
          <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <div>{restaurant.address.street}</div>
            <div>
              {restaurant.address.city}, {restaurant.address.state} {restaurant.address.zipCode}
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="flex items-center space-x-2 text-gray-600">
          <Phone className="h-5 w-5" />
          <span>{restaurant.contact.phone}</span>
        </div>

        <div className="flex items-center space-x-2 text-gray-600">
          <Mail className="h-5 w-5" />
          <span>{restaurant.contact.email}</span>
        </div>
      </div>

      {/* Operating Hours */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Operating Hours
        </h3>
        <div className="space-y-1">
          {operatingHours.map((day, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">{day.day}</span>
              <span className={`${day.hours === 'Closed' ? 'text-red-500' : 'text-gray-600'}`}>
                {day.hours}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      {restaurant.aiRecommendations && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            AI Insights
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Trending Score:</span>
              <span className="font-medium">
                {restaurant.aiRecommendations.trendingScore || 0}/10
              </span>
            </div>
            {restaurant.aiRecommendations.popularItems && restaurant.aiRecommendations.popularItems.length > 0 && (
              <div>
                <span className="text-gray-600">Popular Items:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {restaurant.aiRecommendations.popularItems.slice(0, 3).map((item, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantInfo;
