export interface Workshop {
    _id: string;
    eventRef: string;
    name: string;
    about: string;
    imageUrl: string;
    registrationFormUrl: string;

  }
  export interface WorkshopResponse {
    message: string;    
    
    data: Workshop[];
    
  }
  