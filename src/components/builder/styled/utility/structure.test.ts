import { styleStructure } from './structure';

describe('requirement of styleConvert', () => {
    it('should convert singular value correctly', () => {
        expect(styleStructure(5)).toStrictEqual({
            xs: '2.5rem'
        });

        expect(styleStructure('2')).toStrictEqual({
            xs: '2'
        });

        expect(styleStructure('0')).toStrictEqual({
            xs: 0
        });

        expect(styleStructure(0)).toStrictEqual({
            xs: 0
        });

        expect(styleStructure('0px')).toStrictEqual({
            xs: '0px'
        });
    });

    it('should convert object value correctly', () => {
        const result = styleStructure({ md: 5, lg: 4, xl: '0px' });
        expect(result).toStrictEqual({
            xl: '0px',
            lg: '2rem',
            md: '2.5rem'
        });
    });
});
