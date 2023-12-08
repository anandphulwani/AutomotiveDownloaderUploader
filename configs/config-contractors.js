/**
 *
 * Configuration in this file will override settings in main config file
 *
 */
const configContractors = {
    /**
     * Setting normalThreshold to `0`, will take the contractor in account for minimumDealerFoldersForEachContractors but will not be used for imagesQty
     * Setting normalThreshold to `-1`, will take the contractor out of calculation totally for minimumDealerFoldersForEachContractors and imagesQty
     */
    contractors: {
        biswas: {
            currentAllotted: 0,
            normalThreshold: 550,
            extraProcessingFolders: [],
            finisher: 'monika',
        },
        saikat: {
            currentAllotted: 0,
            normalThreshold: 300,
            extraProcessingFolders: [],
            finisher: 'rishabh',
        },
        sachin: {
            currentAllotted: 0,
            normalThreshold: 525,
            extraProcessingFolders: [],
            finisher: 'sachin',
        },
        shivani: {
            currentAllotted: 0,
            normalThreshold: 350,
            extraProcessingFolders: [],
            finisher: 'rishabh',
        },
        rakesh: {
            currentAllotted: 0,
            normalThreshold: 250,
            extraProcessingFolders: [],
            finisher: 'rishabh',
        },
        poonam: {
            currentAllotted: 0,
            normalThreshold: 150,
            extraProcessingFolders: [],
            finisher: 'monika',
        },
        kalpana: {
            currentAllotted: 0,
            normalThreshold: 125,
            extraProcessingFolders: [],
            finisher: 'monika',
        },
        // bhavna: {
        //    currentAllotted: 0,
        //    normalThreshold: 70,
        //    extraProcessingFolders: [],
        //    finisher: 'karan',
        //   },
        rishabh: {
            currentAllotted: 0,
            normalThreshold: 30,
            extraProcessingFolders: [],
            finisher: 'rishabh',
        },
        monika: {
            currentAllotted: 0,
            normalThreshold: 100,
            extraProcessingFolders: [],
            finisher: 'monika',
        },
        rohan0: {
            currentAllotted: 0,
            normalThreshold: 0,
            extraProcessingFolders: [],
            finisher: 'karan',
        },
    },
};

// eslint-disable-next-line import/prefer-default-export
export { configContractors };
