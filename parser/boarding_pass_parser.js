var BoardingPassParser = (function () {

    var flightDataStructure = {
        operatingCarrierPNRCode 		: 7,
        fromCityAirportCode 			: 3,
        toCityAirportCode				: 3,
        operatingCarrierDesignator		: 3,
        flightNumber					: 5,
        dateOfFlight					: 3,
        compartmentCode					: 1,
        seatNumber						: 4,
        checkInSequenceNumber			: 5,
        passengerStatus					: 1,
        fieldSizeOfVariableSizeField	: 2
    };

    var validateFlightData = {
        operatingCarrierPNRCode 		: '[A-Z0-9 ]{7}',
        fromCityAirportCode 			: '[A-Z]{3}',
        toCityAirportCode				: '[A-Z]{3}',
        operatingCarrierDesignator		: '[A-Z0-9 ]{3}',
        flightNumber					: '[0-9]{4}[A-Z0-9 ]',
        dateOfFlight					: '[0-9]{3}',
        compartmentCode					: '[A-Z]',
        seatNumber						: '[A-Z0-9 ]{4}',
        checkInSequenceNumber			: '[0-9]{4}[A-Z0-9 ]',
        passengerStatus					: '[A-Z0-9]',
        fieldSizeOfVariableSizeField	: ''
    };

    var boardingPassUniqueFieldDataStructure = {
        formatCode								:  1,
        numberOfLegsEncoded						:  1,
        passengerName							:  20,
        electronicTicketIndicator				:  1,
        firstFlightSegment						:  37,
        beginningOfVersionNumber				:  1,
        versionNumber					        :  1,
        fieldSizeOfFollowingUniqueMessage	    :  2,
        passengerDescription					:  1,
        sourceOfCheckIn						    :  1,
        sourceOfBoardingPassIssuance			:  1,
        dateOfBoardingPassIssue				    :  4,
        documentType							:  1,
        airlineDesignatorOfBoardingPassIssuer   :  3,
        baggageTagLicensePlateNumber			:  13,
        firstNonConsecutiveBaggageTagLPN		:  13,
        secondNonConsecutiveBaggageTagLPN		:  13
    };

    var validateBoardingPassUniqueFieldData = {
        formatCode								:  '[A-Z0-9]',
        numberOfLegsEncoded						:  '[0-9]',
        passengerName							:  '[A-Z0-9 /]+',
        electronicTicketIndicator				:  '[A-Z0-9 ]',
        firstFlightSegment						:  '[A-Z0-9 ]+',
        beginningOfVersionNumber				:  '[>]',
        versionNumber					        :  '[A-Z0-9]',
        fieldSizeOfFollowingUniqueMessage	    :  '[0-9A-Z]{2}',
        passengerDescription					:  '[A-Z0-9]',
        sourceOfCheckIn						    :  '[A-Z0-9]',
        sourceOfBoardingPassIssuance			:  '[A-Z0-9]',
        dateOfBoardingPassIssue				    :  '[0-9]{4}',
        documentType							:  '[A-Z0-9]',
        airlineDesignatorOfBoardingPassIssuer   :  '[A-Z0-9 ]{3}',
        baggageTagLicensePlateNumber			:  '',
        firstNonConsecutiveBaggageTagLPN		:  '',
        secondNonConsecutiveBaggageTagLPN		:  ''
    };

    var parsedBoardingPassData = {
        formatCode								: '',
        numberOfLegsEncoded						: '',
        passengerName							: '',
        electronicTicketIndicator				: '',
        firstFlightSegment						: '',
        beginningOfVersionNumber				: '',
        versionNumber							: '',
        fieldSizeOfFollowingUniqueMessage		: '',
        passengerDescription					: '',
        sourceOfCheckIn							: '',
        sourceOfBoardingPassIssuance			: '',
        dateOfBoardingPassIssue					: '',
        documentType							: '',
        airlineDesignatorOfBoardingPassIssuer 	: '',
        baggageTagLicensePlateNumber			: '',
        firstNonConsecutiveBaggageTagLPN		: '',
        secondNonConsecutiveBaggageTagLPN		: '',

        flightSegments							: [],
        securityData							: ''
        //fullBoardingPassDataString              : ''

    };

    function processFlightDate(flightDay){
        var currentDate = new Date();
        var travelDate = new Date((new Date(currentDate.getFullYear(),0)).setDate(flightDay));
        var diffDays = moment(currentDate).diff(moment(travelDate),'days');
        var mTravelDate = moment(travelDate);
        if(diffDays>14){
            mTravelDate = moment(travelDate).add(1,"years");
        }
        return mTravelDate.format("DD-MM-YYYY").toString();
    };


    function parseBoardingPassAlgorithm(boardingPassString){

        if(boardingPassString.length<65){
            throw "invalid boarding pass string, cannot be less than 65 characters";
        }


        var temp = boardingPassString;
        var indexOfUniqueDataFieldSize = Object.keys(boardingPassUniqueFieldDataStructure).indexOf('fieldSizeOfFollowingUniqueMessage');
        var indexOfSecondBaggageTagLPN = Object.keys(boardingPassUniqueFieldDataStructure).indexOf('secondNonConsecutiveBaggageTagLPN');

        for (var property in boardingPassUniqueFieldDataStructure) {
            var propertyIndex  = Object.keys(boardingPassUniqueFieldDataStructure).indexOf(property);
            var propertyLength = boardingPassUniqueFieldDataStructure[property];
            if(temp!=""){
                parsedBoardingPassData[property] = temp.substr(0, propertyLength);
                if(validateBoardingPassUniqueFieldData[property]!='' && parsedBoardingPassData[property].match(validateBoardingPassUniqueFieldData[property])==null){
                    throw "invalid '"+property+"' value";
                }

                if(propertyIndex != indexOfUniqueDataFieldSize){
                    temp = temp.substr(propertyLength);
                }
                else{
                    temp = temp.substr(2, parseInt(parsedBoardingPassData[property],16));
                }
            }
            else
                parsedBoardingPassData[property] = '';
            if(propertyIndex == indexOfSecondBaggageTagLPN)break;
        }
        var dateOfBPIssue = parsedBoardingPassData['dateOfBoardingPassIssue'];
		parsedBoardingPassData['dateOfBoardingPassIssue'] = processFlightDate(dateOfBPIssue.substr(dateOfBPIssue.length - 3));
		
		
        var stringSizeUptoUniqueMessageSize = 64;
        var uniqueMessageFieldSize = parseInt(parsedBoardingPassData['fieldSizeOfFollowingUniqueMessage'], 16);
        var unParsedBoardingPassData = boardingPassString.substr(stringSizeUptoUniqueMessageSize + uniqueMessageFieldSize);
        var firstFlightSegment = parsedBoardingPassData['firstFlightSegment'];
        var firstFlightVariableFieldSize = parseInt(firstFlightSegment.substr(firstFlightSegment.length-2, 2), 16);
        var adjustFirstFlightVariableFieldSize = firstFlightVariableFieldSize - (uniqueMessageFieldSize + 4);
        adjustFirstFlightVariableFieldSize = adjustFirstFlightVariableFieldSize >= 10?adjustFirstFlightVariableFieldSize:"0"+adjustFirstFlightVariableFieldSize;
        adjustFirstFlightVariableFieldSize = adjustFirstFlightVariableFieldSize.toString(16);
        parsedBoardingPassData['firstFlightSegment'] = firstFlightSegment.substr(0,firstFlightSegment.length-2)+adjustFirstFlightVariableFieldSize;

        unParsedBoardingPassData = parsedBoardingPassData['firstFlightSegment'] + unParsedBoardingPassData;

        temp = unParsedBoardingPassData;
        var numberOfFlightSegments = parseInt(parsedBoardingPassData['numberOfLegsEncoded']);
        for(var i = 0; i < numberOfFlightSegments ; i++){
            var flightData = {};
            for (var property in flightDataStructure){
                flightData[property] = temp.substr(0, flightDataStructure[property]);

                if(validateFlightData[property]!='' && flightData[property].match(validateFlightData[property])==null){
                    throw "invalid '"+property+"' value on flight segment "+i;
                }

                temp = temp.substr(flightDataStructure[property]);
            }
            flightData['unParsedFlightData'] = temp.substr(0, parseInt(flightData.fieldSizeOfVariableSizeField,16));
            temp = temp.substr(parseInt(flightData.fieldSizeOfVariableSizeField,16));
            flightData['dateOfFlight'] = processFlightDate(flightData['dateOfFlight']);
            parsedBoardingPassData.flightSegments.push(flightData);
            if(temp=="")break;
        }

        //parsedBoardingPassData['fullBoardingPassDataString'] = boardingPassString;
		delete parsedBoardingPassData['firstFlightSegment'];



        return parsedBoardingPassData;
    };


    return {
        parseBoardingPass: function(boardingPass){
            var parsedBoardingPassObj = {
                parsedBoardingPassData : null,
                parseError : ''
            };
            try{
                parsedBoardingPassObj.parsedBoardingPassData = parseBoardingPassAlgorithm(boardingPass);
                parsedBoardingPassObj.parseError = null;
            } catch (e) {
                parsedBoardingPassObj.parsedBoardingPassData = null;
                parsedBoardingPassObj.parseError = e.toString();
            }

            return parsedBoardingPassObj;
        }
    };

})();
