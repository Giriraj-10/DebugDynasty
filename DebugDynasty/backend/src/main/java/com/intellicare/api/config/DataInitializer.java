package com.intellicare.api.config;

import com.intellicare.api.model.*;
import com.intellicare.api.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import org.springframework.transaction.annotation.Transactional;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private AmbulanceRepository ambulanceRepository;

    @Autowired
    private BloodBankRepository bloodBankRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        seedHospitals();
        seedAmbulances();
        seedBloodBanks();
    }

    private void seedHospitals() {
        if (hospitalRepository.count() > 0) {
            return;
        }

        // Hospital 1: City General Hospital (Available beds: 15)
        createHospital(
            "mock-hospital-1",
            "hospital1@intellicare.com",
            "City General Hospital",
            "HOSP-111",
            "123 Central Ave, Mumbai",
            "022-11112222",
            19.0820,
            72.8820,
            120,
            15
        );

        // Hospital 2: Mercy Care Clinic (Available beds: 5)
        createHospital(
            "mock-hospital-2",
            "hospital2@intellicare.com",
            "Mercy Care Clinic",
            "HOSP-222",
            "456 West Rd, Mumbai",
            "022-33334444",
            19.0650,
            72.8910,
            80,
            5
        );

        // Hospital 3: St. Jude Emergency Center (Available beds: 0 - should be filtered out!)
        createHospital(
            "mock-hospital-3",
            "hospital3@intellicare.com",
            "St. Jude Emergency Center",
            "HOSP-333",
            "789 East Highway, Mumbai",
            "022-55556666",
            19.0950,
            72.8550,
            150,
            0
        );

        // Hospital 4: Apex Trauma Hospital (Available beds: 30)
        createHospital(
            "mock-hospital-4",
            "hospital4@intellicare.com",
            "Apex Trauma Hospital",
            "HOSP-444",
            "99 North Bypass, Mumbai",
            "022-77778888",
            19.1010,
            72.8720,
            200,
            30
        );
    }

    private void createHospital(String uid, String email, String name, String regNo, 
                                String address, String contact, Double lat, Double lon, 
                                Integer totalBeds, Integer availableBeds) {
        User user = User.builder()
                .firebaseUid(uid)
                .email(email)
                .role(Role.HOSPITAL)
                .build();
        user = userRepository.save(user);

        Hospital hospital = Hospital.builder()
                .user(user)
                .hospitalName(name)
                .registrationNumber(regNo)
                .address(address)
                .contactNumber(contact)
                .latitude(lat)
                .longitude(lon)
                .totalBeds(totalBeds)
                .availableBeds(availableBeds)
                .build();
        hospitalRepository.save(hospital);
    }

    private void seedAmbulances() {
        if (ambulanceRepository.count() > 0) {
            return;
        }

        // Ambulance 1: Ambulance Alfa (Available, nearest)
        createAmbulance(
            "mock-ambulance-1",
            "ambulance1@intellicare.com",
            "Ambulance Alfa Services",
            "MH-12-AA-1111",
            "John Alfa",
            "9876543211",
            19.0720,
            72.8650,
            "AVAILABLE"
        );

        // Ambulance 2: Ambulance Bravo (Available, further)
        createAmbulance(
            "mock-ambulance-2",
            "ambulance2@intellicare.com",
            "Ambulance Bravo Fleet",
            "MH-12-BB-2222",
            "Robert Bravo",
            "9876543212",
            19.0850,
            72.8950,
            "AVAILABLE"
        );

        // Ambulance 3: Ambulance Charlie (ASSIGNED - busy)
        createAmbulance(
            "mock-ambulance-3",
            "ambulance3@intellicare.com",
            "Ambulance Charlie Rescue",
            "MH-12-CC-3333",
            "Charles Charlie",
            "9876543213",
            19.0910,
            72.8600,
            "ASSIGNED"
        );
    }

    private void createAmbulance(String uid, String email, String provider, String vehicleNo,
                                 String driver, String contact, Double lat, Double lon, String status) {
        User user = User.builder()
                .firebaseUid(uid)
                .email(email)
                .role(Role.AMBULANCE)
                .build();
        user = userRepository.save(user);

        Ambulance ambulance = Ambulance.builder()
                .user(user)
                .providerName(provider)
                .vehicleNumber(vehicleNo)
                .driverName(driver)
                .contactNumber(contact)
                .latitude(lat)
                .longitude(lon)
                .status(status)
                .build();
        ambulanceRepository.save(ambulance);
    }

    private void seedBloodBanks() {
        if (bloodBankRepository.count() > 0) {
            return;
        }

        createBloodBank(
            "mock-bloodbank-1",
            "bloodbank1@intellicare.com",
            "National Red Cross Blood Bank",
            "BANK-REG-777",
            "77 Life-saving Road, Central District, Mumbai",
            "9876543210",
            45, 12, 38, 8, 25, 4, 60, 15
        );

        createBloodBank(
            "mock-bloodbank-2",
            "bloodbank2@intellicare.com",
            "Metro Blood Alliance",
            "BANK-REG-888",
            "102 Health Lane, West Mumbai",
            "9876543215",
            20, 5, 25, 3, 10, 2, 30, 8
        );
    }

    private void createBloodBank(String uid, String email, String name, String regNo,
                                 String address, String contact,
                                 int aPos, int aNeg, int bPos, int bNeg,
                                 int abPos, int abNeg, int oPos, int oNeg) {
        User user = User.builder()
                .firebaseUid(uid)
                .email(email)
                .role(Role.BLOOD_BANK)
                .build();
        user = userRepository.save(user);

        BloodBank bloodBank = BloodBank.builder()
                .user(user)
                .bloodBankName(name)
                .registrationNumber(regNo)
                .address(address)
                .contactNumber(contact)
                .aPositive(aPos)
                .aNegative(aNeg)
                .bPositive(bPos)
                .bNegative(bNeg)
                .abPositive(abPos)
                .abNegative(abNeg)
                .oPositive(oPos)
                .oNegative(oNeg)
                .build();
        bloodBankRepository.save(bloodBank);
    }
}
